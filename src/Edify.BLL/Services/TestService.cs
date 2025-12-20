using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Tests;
using Edify.Core.Entities;
using Edify.Core.Enums;
using Edify.Core.Interfaces;

namespace Edify.BLL.Services;

public class TestService : ITestService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService? _notificationService;

    public TestService(IUnitOfWork unitOfWork, INotificationService? notificationService = null)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    #region Test CRUD

    public async Task<TestResponseDto> CreateTestAsync(int userId, CreateTestDto createDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null || !user.CanTeach)
            throw new UnauthorizedException("Only teachers can create tests");

        var course = await _unitOfWork.Courses.GetByIdAsync(createDto.CourseId);
        if (course == null)
            throw new NotFoundException("Course not found");

        if (course.TeacherId != userId)
            throw new UnauthorizedException("You can only create tests for your own courses");

        var test = new Test
        {
            Title = createDto.Title,
            Description = createDto.Description,
            Instructions = createDto.Instructions,
            TimeLimitMinutes = createDto.TimeLimitMinutes,
            MaxAttempts = createDto.MaxAttempts,
            PassingScore = createDto.PassingScore,
            ShuffleQuestions = createDto.ShuffleQuestions,
            ShuffleAnswers = createDto.ShuffleAnswers,
            ShowResultsImmediately = createDto.ShowResultsImmediately,
            ShowCorrectAnswers = createDto.ShowCorrectAnswers,
            AvailableFrom = createDto.AvailableFrom.HasValue 
                ? DateTime.SpecifyKind(createDto.AvailableFrom.Value, DateTimeKind.Utc) 
                : null,
            AvailableUntil = createDto.AvailableUntil.HasValue 
                ? DateTime.SpecifyKind(createDto.AvailableUntil.Value, DateTimeKind.Utc) 
                : null,
            CourseId = createDto.CourseId,
            CreatedByUserId = userId,
            Status = TestStatus.Draft
        };

        await _unitOfWork.Tests.AddAsync(test);
        await _unitOfWork.SaveChangesAsync();

        // Add questions if provided
        for (int i = 0; i < createDto.Questions.Count; i++)
        {
            var questionDto = createDto.Questions[i];
            var questionType = (QuestionType)questionDto.Type;
            
            // Validate that questions requiring answer options have them
            if (questionType == QuestionType.MultipleChoice || 
                questionType == QuestionType.TrueFalse || 
                questionType == QuestionType.MultipleSelect)
            {
                if (questionDto.AnswerOptions == null || !questionDto.AnswerOptions.Any())
                {
                    throw new BadRequestException($"Question '{questionDto.QuestionText}' requires answer options");
                }
                
                if (questionDto.AnswerOptions.Any(o => string.IsNullOrWhiteSpace(o.OptionText)))
                {
                    throw new BadRequestException($"All answer options for question '{questionDto.QuestionText}' must have text");
                }
                
                // Validate that at least one option is marked as correct
                if (!questionDto.AnswerOptions.Any(o => o.IsCorrect))
                {
                    throw new BadRequestException($"Question '{questionDto.QuestionText}' must have at least one correct answer");
                }
            }
            
            var question = new Question
            {
                QuestionText = questionDto.QuestionText,
                Explanation = questionDto.Explanation,
                Type = questionType,
                Points = questionDto.Points,
                OrderIndex = questionDto.OrderIndex > 0 ? questionDto.OrderIndex : i + 1,
                CorrectShortAnswer = questionDto.CorrectShortAnswer,
                CaseSensitive = questionDto.CaseSensitive,
                TestId = test.Id
            };

            await _unitOfWork.Questions.AddAsync(question);
            await _unitOfWork.SaveChangesAsync();

            // Add answer options (only for question types that need them)
            if (questionDto.AnswerOptions != null && questionDto.AnswerOptions.Any())
            {
                for (int j = 0; j < questionDto.AnswerOptions.Count; j++)
                {
                    var optionDto = questionDto.AnswerOptions[j];
                    if (!string.IsNullOrWhiteSpace(optionDto.OptionText))
                    {
                        var option = new AnswerOption
                        {
                            OptionText = optionDto.OptionText!,
                            IsCorrect = optionDto.IsCorrect,
                            OrderIndex = optionDto.OrderIndex > 0 ? optionDto.OrderIndex : j + 1,
                            QuestionId = question.Id
                        };
                        await _unitOfWork.AnswerOptions.AddAsync(option);
                    }
                }
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return await GetTestByIdAsync(test.Id, userId);
    }

    public async Task<TestResponseDto> UpdateTestAsync(int userId, int testId, UpdateTestDto updateDto)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null || !test.IsActive)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only update your own tests");

        if (updateDto.Title != null) test.Title = updateDto.Title;
        if (updateDto.Description != null) test.Description = updateDto.Description;
        if (updateDto.Instructions != null) test.Instructions = updateDto.Instructions;
        if (updateDto.TimeLimitMinutes.HasValue) test.TimeLimitMinutes = updateDto.TimeLimitMinutes.Value;
        if (updateDto.MaxAttempts.HasValue) test.MaxAttempts = updateDto.MaxAttempts.Value;
        if (updateDto.PassingScore.HasValue) test.PassingScore = updateDto.PassingScore.Value;
        if (updateDto.ShuffleQuestions.HasValue) test.ShuffleQuestions = updateDto.ShuffleQuestions.Value;
        if (updateDto.ShuffleAnswers.HasValue) test.ShuffleAnswers = updateDto.ShuffleAnswers.Value;
        if (updateDto.ShowResultsImmediately.HasValue) test.ShowResultsImmediately = updateDto.ShowResultsImmediately.Value;
        if (updateDto.ShowCorrectAnswers.HasValue) test.ShowCorrectAnswers = updateDto.ShowCorrectAnswers.Value;
        if (updateDto.AvailableFrom.HasValue) 
            test.AvailableFrom = DateTime.SpecifyKind(updateDto.AvailableFrom.Value, DateTimeKind.Utc);
        if (updateDto.AvailableUntil.HasValue) 
            test.AvailableUntil = DateTime.SpecifyKind(updateDto.AvailableUntil.Value, DateTimeKind.Utc);
        if (updateDto.Status.HasValue) test.Status = (TestStatus)updateDto.Status.Value;

        await _unitOfWork.Tests.UpdateAsync(test);
        await _unitOfWork.SaveChangesAsync();

        return await GetTestByIdAsync(testId, userId);
    }

    public async Task DeleteTestAsync(int userId, int testId)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only delete your own tests");

        test.IsActive = false;
        await _unitOfWork.Tests.UpdateAsync(test);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<TestResponseDto> GetTestByIdAsync(int testId, int userId)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null || !test.IsActive)
            throw new NotFoundException("Test not found");

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        var creator = await _unitOfWork.Users.GetByIdAsync(test.CreatedByUserId);

        bool isTeacher = course?.TeacherId == userId;
        bool isEnrolled = false;

        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == test.CourseId && e.Status == EnrollmentStatus.Approved);
            isEnrolled = enrollment != null;
        }

        if (!isTeacher && !isEnrolled)
            throw new UnauthorizedException("You don't have access to this test");

        var questions = await _unitOfWork.Questions.FindAsync(q => q.TestId == testId && q.IsActive);
        var questionDtos = new List<QuestionResponseDto>();

        foreach (var question in questions.OrderBy(q => q.OrderIndex))
        {
            var options = await _unitOfWork.AnswerOptions.FindAsync(o => o.QuestionId == question.Id);
            questionDtos.Add(new QuestionResponseDto
            {
                Id = question.Id,
                QuestionText = question.QuestionText,
                Explanation = isTeacher ? question.Explanation : null,
                Type = question.Type,
                Points = question.Points,
                OrderIndex = question.OrderIndex,
                CorrectShortAnswer = isTeacher ? question.CorrectShortAnswer : null,
                CaseSensitive = question.CaseSensitive,
                AnswerOptions = options.OrderBy(o => o.OrderIndex).Select(o => new AnswerOptionResponseDto
                {
                    Id = o.Id,
                    OptionText = o.OptionText,
                    OrderIndex = o.OrderIndex,
                    IsCorrect = isTeacher ? o.IsCorrect : null
                }).ToList()
            });
        }

        // Get attempt counts
        var allAttempts = await _unitOfWork.TestAttempts.FindAsync(a => a.TestId == testId);
        var allAttemptsList = allAttempts.ToList();
        int attemptCount = allAttemptsList.Count(a => a.Status != TestAttemptStatus.InProgress);

        // Get student's attempt info
        int? attemptsUsed = null;
        decimal? bestScore = null;
        bool? hasPassed = null;

        if (!isTeacher)
        {
            var studentAttempts = allAttemptsList.Where(a => a.StudentId == userId).ToList();
            attemptsUsed = studentAttempts.Count;
            if (studentAttempts.Any(a => a.Percentage.HasValue))
            {
                bestScore = studentAttempts.Where(a => a.Percentage.HasValue).Max(a => a.Percentage);
                hasPassed = studentAttempts.Any(a => a.Passed == true);
            }
        }

        return new TestResponseDto
        {
            Id = test.Id,
            Title = test.Title,
            Description = test.Description,
            Instructions = test.Instructions,
            TimeLimitMinutes = test.TimeLimitMinutes,
            MaxAttempts = test.MaxAttempts,
            PassingScore = test.PassingScore,
            ShuffleQuestions = test.ShuffleQuestions,
            ShuffleAnswers = test.ShuffleAnswers,
            ShowResultsImmediately = test.ShowResultsImmediately,
            ShowCorrectAnswers = test.ShowCorrectAnswers,
            AvailableFrom = test.AvailableFrom,
            AvailableUntil = test.AvailableUntil,
            Status = test.Status,
            CourseId = test.CourseId,
            CourseName = course?.Title ?? "",
            CreatedBy = $"{creator?.FirstName} {creator?.LastName}",
            CreatedAt = test.CreatedAt,
            QuestionCount = questionDtos.Count,
            TotalPoints = questionDtos.Sum(q => q.Points),
            AttemptCount = attemptCount,
            AttemptsUsed = attemptsUsed,
            BestScore = bestScore,
            HasPassed = hasPassed,
            Questions = isTeacher ? questionDtos : new List<QuestionResponseDto>()
        };
    }

    public async Task<IEnumerable<TestResponseDto>> GetCourseTestsAsync(int courseId, int userId)
    {
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        if (course == null)
            throw new NotFoundException("Course not found");

        bool isTeacher = course.TeacherId == userId;

        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == courseId && e.Status == EnrollmentStatus.Approved);
            if (enrollment == null)
                throw new UnauthorizedException("You don't have access to this course");
        }

        var tests = await _unitOfWork.Tests.FindAsync(t => t.CourseId == courseId && t.IsActive);

        // Students only see published tests
        if (!isTeacher)
            tests = tests.Where(t => t.Status == TestStatus.Published);

        var result = new List<TestResponseDto>();
        foreach (var test in tests.OrderByDescending(t => t.CreatedAt))
        {
            result.Add(await GetTestByIdAsync(test.Id, userId));
        }

        return result;
    }

    public async Task<TestResponseDto> PublishTestAsync(int userId, int testId)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null || !test.IsActive)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only publish your own tests");

        var questions = await _unitOfWork.Questions.FindAsync(q => q.TestId == testId && q.IsActive);
        if (!questions.Any())
            throw new BadRequestException("Cannot publish a test without questions");

        test.Status = TestStatus.Published;
        await _unitOfWork.Tests.UpdateAsync(test);
        await _unitOfWork.SaveChangesAsync();

        // Send real-time notification to all enrolled students
        if (_notificationService != null)
        {
            try
            {
                await _notificationService.NotifyTestPublishedAsync(
                    test.CourseId,
                    test.Id,
                    test.Title,
                    test.AvailableUntil
                );
            }
            catch
            {
                // Notification failure shouldn't break the publish
            }
        }

        return await GetTestByIdAsync(testId, userId);
    }

    public async Task<TestResponseDto> CloseTestAsync(int userId, int testId)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null || !test.IsActive)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only close your own tests");

        test.Status = TestStatus.Closed;
        await _unitOfWork.Tests.UpdateAsync(test);
        await _unitOfWork.SaveChangesAsync();

        return await GetTestByIdAsync(testId, userId);
    }

    #endregion

    #region Question Management

    public async Task<QuestionResponseDto> AddQuestionAsync(int userId, int testId, CreateQuestionDto questionDto)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null || !test.IsActive)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only add questions to your own tests");

        var existingQuestions = await _unitOfWork.Questions.FindAsync(q => q.TestId == testId && q.IsActive);
        int maxOrder = existingQuestions.Any() ? existingQuestions.Max(q => q.OrderIndex) : 0;

        var question = new Question
        {
            QuestionText = questionDto.QuestionText,
            Explanation = questionDto.Explanation,
            Type = (QuestionType)questionDto.Type,
            Points = questionDto.Points,
            OrderIndex = questionDto.OrderIndex > 0 ? questionDto.OrderIndex : maxOrder + 1,
            CorrectShortAnswer = questionDto.CorrectShortAnswer,
            CaseSensitive = questionDto.CaseSensitive,
            TestId = testId
        };

        await _unitOfWork.Questions.AddAsync(question);
        await _unitOfWork.SaveChangesAsync();

        for (int i = 0; i < questionDto.AnswerOptions.Count; i++)
        {
            var optionDto = questionDto.AnswerOptions[i];
            if (!string.IsNullOrWhiteSpace(optionDto.OptionText))
            {
                var option = new AnswerOption
                {
                    OptionText = optionDto.OptionText!,
                    IsCorrect = optionDto.IsCorrect,
                    OrderIndex = optionDto.OrderIndex > 0 ? optionDto.OrderIndex : i + 1,
                    QuestionId = question.Id
                };
                await _unitOfWork.AnswerOptions.AddAsync(option);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        var options = await _unitOfWork.AnswerOptions.FindAsync(o => o.QuestionId == question.Id);

        return new QuestionResponseDto
        {
            Id = question.Id,
            QuestionText = question.QuestionText,
            Explanation = question.Explanation,
            Type = question.Type,
            Points = question.Points,
            OrderIndex = question.OrderIndex,
            CorrectShortAnswer = question.CorrectShortAnswer,
            CaseSensitive = question.CaseSensitive,
            AnswerOptions = options.OrderBy(o => o.OrderIndex).Select(o => new AnswerOptionResponseDto
            {
                Id = o.Id,
                OptionText = o.OptionText,
                OrderIndex = o.OrderIndex,
                IsCorrect = o.IsCorrect
            }).ToList()
        };
    }

    public async Task<QuestionResponseDto> UpdateQuestionAsync(int userId, int questionId, UpdateQuestionDto questionDto)
    {
        var question = await _unitOfWork.Questions.GetByIdAsync(questionId);
        if (question == null || !question.IsActive)
            throw new NotFoundException("Question not found");

        var test = await _unitOfWork.Tests.GetByIdAsync(question.TestId);
        var course = await _unitOfWork.Courses.GetByIdAsync(test!.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only update questions in your own tests");

        if (questionDto.QuestionText != null) question.QuestionText = questionDto.QuestionText;
        if (questionDto.Explanation != null) question.Explanation = questionDto.Explanation;
        if (questionDto.Type.HasValue) question.Type = (QuestionType)questionDto.Type.Value;
        if (questionDto.Points.HasValue) question.Points = questionDto.Points.Value;
        if (questionDto.OrderIndex.HasValue) question.OrderIndex = questionDto.OrderIndex.Value;
        if (questionDto.CorrectShortAnswer != null) question.CorrectShortAnswer = questionDto.CorrectShortAnswer;
        if (questionDto.CaseSensitive.HasValue) question.CaseSensitive = questionDto.CaseSensitive.Value;

        await _unitOfWork.Questions.UpdateAsync(question);
        await _unitOfWork.SaveChangesAsync();

        var options = await _unitOfWork.AnswerOptions.FindAsync(o => o.QuestionId == question.Id);

        return new QuestionResponseDto
        {
            Id = question.Id,
            QuestionText = question.QuestionText,
            Explanation = question.Explanation,
            Type = question.Type,
            Points = question.Points,
            OrderIndex = question.OrderIndex,
            CorrectShortAnswer = question.CorrectShortAnswer,
            CaseSensitive = question.CaseSensitive,
            AnswerOptions = options.OrderBy(o => o.OrderIndex).Select(o => new AnswerOptionResponseDto
            {
                Id = o.Id,
                OptionText = o.OptionText,
                OrderIndex = o.OrderIndex,
                IsCorrect = o.IsCorrect
            }).ToList()
        };
    }

    public async Task DeleteQuestionAsync(int userId, int questionId)
    {
        var question = await _unitOfWork.Questions.GetByIdAsync(questionId);
        if (question == null)
            throw new NotFoundException("Question not found");

        var test = await _unitOfWork.Tests.GetByIdAsync(question.TestId);
        var course = await _unitOfWork.Courses.GetByIdAsync(test!.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only delete questions in your own tests");

        question.IsActive = false;
        await _unitOfWork.Questions.UpdateAsync(question);
        await _unitOfWork.SaveChangesAsync();
    }

    #endregion

    #region Test Taking

    public async Task<TestTakingDto> StartTestAttemptAsync(int userId, int testId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null || !user.CanStudy)
            throw new UnauthorizedException("Only students can take tests");

        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null || !test.IsActive)
            throw new NotFoundException("Test not found");

        if (test.Status != TestStatus.Published)
            throw new BadRequestException("This test is not available");

        // Check availability window
        var now = DateTime.UtcNow;
        if (test.AvailableFrom.HasValue && now < test.AvailableFrom.Value)
            throw new BadRequestException("This test is not yet available");
        if (test.AvailableUntil.HasValue && now > test.AvailableUntil.Value)
            throw new BadRequestException("This test is no longer available");

        // Check enrollment
        var enrollment = await _unitOfWork.Enrollments.GetAsync(
            e => e.StudentId == userId && e.CourseId == test.CourseId && e.Status == EnrollmentStatus.Approved);
        if (enrollment == null)
            throw new UnauthorizedException("You must be enrolled in the course to take this test");

        // Check attempt limit
        var existingAttempts = await _unitOfWork.TestAttempts.FindAsync(
            a => a.TestId == testId && a.StudentId == userId);
        var attemptsList = existingAttempts.ToList();

        // Check for in-progress attempt
        var inProgressAttempt = attemptsList.FirstOrDefault(a => a.Status == TestAttemptStatus.InProgress);
        if (inProgressAttempt != null)
        {
            // Check if it's expired
            if (inProgressAttempt.ExpiresAt.HasValue && now > inProgressAttempt.ExpiresAt.Value)
            {
                inProgressAttempt.Status = TestAttemptStatus.TimedOut;
                await _unitOfWork.TestAttempts.UpdateAsync(inProgressAttempt);
                await _unitOfWork.SaveChangesAsync();
            }
            else
            {
                // Return existing attempt
                return await BuildTestTakingDto(test, inProgressAttempt);
            }
        }

        int completedAttempts = attemptsList.Count(a => a.Status != TestAttemptStatus.InProgress);
        if (test.MaxAttempts > 0 && completedAttempts >= test.MaxAttempts)
            throw new BadRequestException($"You have used all {test.MaxAttempts} attempts for this test");

        // Create new attempt
        var attempt = new TestAttempt
        {
            TestId = testId,
            StudentId = userId,
            AttemptNumber = completedAttempts + 1,
            StartedAt = now,
            ExpiresAt = test.TimeLimitMinutes > 0 ? now.AddMinutes(test.TimeLimitMinutes) : null,
            Status = TestAttemptStatus.InProgress
        };

        await _unitOfWork.TestAttempts.AddAsync(attempt);
        await _unitOfWork.SaveChangesAsync();

        return await BuildTestTakingDto(test, attempt);
    }

    private async Task<TestTakingDto> BuildTestTakingDto(Test test, TestAttempt attempt)
    {
        var questions = await _unitOfWork.Questions.FindAsync(q => q.TestId == test.Id && q.IsActive);
        var questionList = questions.ToList();

        if (test.ShuffleQuestions)
            questionList = questionList.OrderBy(_ => Guid.NewGuid()).ToList();
        else
            questionList = questionList.OrderBy(q => q.OrderIndex).ToList();

        var questionDtos = new List<QuestionTakingDto>();

        foreach (var question in questionList)
        {
            var options = await _unitOfWork.AnswerOptions.FindAsync(o => o.QuestionId == question.Id);
            var optionList = options.ToList();

            if (test.ShuffleAnswers)
                optionList = optionList.OrderBy(_ => Guid.NewGuid()).ToList();
            else
                optionList = optionList.OrderBy(o => o.OrderIndex).ToList();

            questionDtos.Add(new QuestionTakingDto
            {
                Id = question.Id,
                QuestionText = question.QuestionText,
                Type = question.Type,
                Points = question.Points,
                OrderIndex = question.OrderIndex,
                AnswerOptions = optionList.Select(o => new AnswerOptionTakingDto
                {
                    Id = o.Id,
                    OptionText = o.OptionText,
                    OrderIndex = o.OrderIndex
                }).ToList()
            });
        }

        return new TestTakingDto
        {
            Id = test.Id,
            Title = test.Title,
            Instructions = test.Instructions,
            TimeLimitMinutes = test.TimeLimitMinutes,
            ExpiresAt = attempt.ExpiresAt,
            AttemptId = attempt.Id,
            Questions = questionDtos
        };
    }

    public async Task<StudentAnswerResponseDto> SaveAnswerAsync(int userId, SaveAnswerDto saveDto)
    {
        var attempt = await _unitOfWork.TestAttempts.GetByIdAsync(saveDto.AttemptId);
        if (attempt == null)
            throw new NotFoundException("Test attempt not found");

        if (attempt.StudentId != userId)
            throw new UnauthorizedException("This is not your test attempt");

        if (attempt.Status != TestAttemptStatus.InProgress)
            throw new BadRequestException("This test attempt has already been submitted");

        // Check if timed out
        if (attempt.ExpiresAt.HasValue && DateTime.UtcNow > attempt.ExpiresAt.Value)
        {
            attempt.Status = TestAttemptStatus.TimedOut;
            await _unitOfWork.TestAttempts.UpdateAsync(attempt);
            await _unitOfWork.SaveChangesAsync();
            throw new BadRequestException("This test has timed out");
        }

        var question = await _unitOfWork.Questions.GetByIdAsync(saveDto.QuestionId);
        if (question == null || question.TestId != attempt.TestId)
            throw new BadRequestException("Invalid question for this test");

        // Find or create student answer
        var existingAnswer = await _unitOfWork.StudentAnswers.GetAsync(
            a => a.TestAttemptId == saveDto.AttemptId && a.QuestionId == saveDto.QuestionId);

        if (existingAnswer != null)
        {
            existingAnswer.SelectedOptionIds = saveDto.SelectedOptionIds != null
                ? string.Join(",", saveDto.SelectedOptionIds)
                : null;
            existingAnswer.TextAnswer = saveDto.TextAnswer;
            await _unitOfWork.StudentAnswers.UpdateAsync(existingAnswer);
        }
        else
        {
            existingAnswer = new StudentAnswer
            {
                TestAttemptId = saveDto.AttemptId,
                QuestionId = saveDto.QuestionId,
                SelectedOptionIds = saveDto.SelectedOptionIds != null
                    ? string.Join(",", saveDto.SelectedOptionIds)
                    : null,
                TextAnswer = saveDto.TextAnswer
            };
            await _unitOfWork.StudentAnswers.AddAsync(existingAnswer);
        }

        await _unitOfWork.SaveChangesAsync();

        return new StudentAnswerResponseDto
        {
            Id = existingAnswer.Id,
            QuestionId = question.Id,
            QuestionText = question.QuestionText,
            QuestionType = question.Type,
            QuestionPoints = question.Points,
            SelectedOptionIds = saveDto.SelectedOptionIds,
            TextAnswer = saveDto.TextAnswer
        };
    }

    public async Task<TestAttemptResponseDto> SubmitTestAsync(int userId, SubmitTestDto submitDto)
    {
        var attempt = await _unitOfWork.TestAttempts.GetByIdAsync(submitDto.AttemptId);
        if (attempt == null)
            throw new NotFoundException("Test attempt not found");

        if (attempt.StudentId != userId)
            throw new UnauthorizedException("This is not your test attempt");

        if (attempt.Status != TestAttemptStatus.InProgress)
            throw new BadRequestException("This test attempt has already been submitted");

        // Get existing answers for this attempt
        var existingAnswers = (await _unitOfWork.StudentAnswers.FindAsync(
            a => a.TestAttemptId == submitDto.AttemptId)).ToList();

        // Save/update all answers
        foreach (var answerDto in submitDto.Answers)
        {
            var existingAnswer = existingAnswers.FirstOrDefault(a => a.QuestionId == answerDto.QuestionId);
            
            if (existingAnswer != null)
            {
                existingAnswer.SelectedOptionIds = answerDto.SelectedOptionIds != null && answerDto.SelectedOptionIds.Any()
                    ? string.Join(",", answerDto.SelectedOptionIds)
                    : null;
                existingAnswer.TextAnswer = answerDto.TextAnswer;
                await _unitOfWork.StudentAnswers.UpdateAsync(existingAnswer);
            }
            else
            {
                var newAnswer = new StudentAnswer
                {
                    TestAttemptId = submitDto.AttemptId,
                    QuestionId = answerDto.QuestionId,
                    SelectedOptionIds = answerDto.SelectedOptionIds != null && answerDto.SelectedOptionIds.Any()
                        ? string.Join(",", answerDto.SelectedOptionIds)
                        : null,
                    TextAnswer = answerDto.TextAnswer
                };
                await _unitOfWork.StudentAnswers.AddAsync(newAnswer);
                existingAnswers.Add(newAnswer); // Track for grading
            }
        }

        await _unitOfWork.SaveChangesAsync();

        // Auto-grade the test using the answers we already have in memory
        await AutoGradeAttemptWithAnswers(attempt, existingAnswers);

        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.Status = TestAttemptStatus.Submitted;

        var test = await _unitOfWork.Tests.GetByIdAsync(attempt.TestId);
        
        // Check if all questions are auto-gradable
        var questions = await _unitOfWork.Questions.FindAsync(q => q.TestId == attempt.TestId && q.IsActive);
        bool hasManualGrading = questions.Any(q => q.Type == QuestionType.Essay);

        if (!hasManualGrading)
        {
            attempt.Status = TestAttemptStatus.Graded;
            attempt.GradedAt = DateTime.UtcNow;
        }

        await _unitOfWork.TestAttempts.UpdateAsync(attempt);
        await _unitOfWork.SaveChangesAsync();

        return await GetAttemptResultAsync(attempt.Id, userId);
    }

    private async Task AutoGradeAttempt(TestAttempt attempt)
    {
        var answers = (await _unitOfWork.StudentAnswers.FindAsync(a => a.TestAttemptId == attempt.Id)).ToList();
        await AutoGradeAttemptWithAnswers(attempt, answers);
    }

    private async Task AutoGradeAttemptWithAnswers(TestAttempt attempt, List<StudentAnswer> answers)
    {
        decimal totalScore = 0;
        decimal maxScore = 0;

        var questions = await _unitOfWork.Questions.FindAsync(q => q.TestId == attempt.TestId && q.IsActive);

        foreach (var question in questions)
        {
            maxScore += question.Points;

            var answer = answers.FirstOrDefault(a => a.QuestionId == question.Id);
            if (answer == null) continue;

            switch (question.Type)
            {
                case QuestionType.MultipleChoice:
                case QuestionType.TrueFalse:
                    var correctOptions = await _unitOfWork.AnswerOptions.FindAsync(
                        o => o.QuestionId == question.Id && o.IsCorrect);
                    var correctId = correctOptions.FirstOrDefault()?.Id;

                    if (!string.IsNullOrEmpty(answer.SelectedOptionIds))
                    {
                        var selectedIds = answer.SelectedOptionIds.Split(',').Select(int.Parse).ToList();
                        if (selectedIds.Count == 1 && selectedIds[0] == correctId)
                        {
                            answer.PointsEarned = question.Points;
                            answer.IsCorrect = true;
                            totalScore += question.Points;
                        }
                        else
                        {
                            answer.PointsEarned = 0;
                            answer.IsCorrect = false;
                        }
                    }
                    break;

                case QuestionType.MultipleSelect:
                    var allCorrectOptions = await _unitOfWork.AnswerOptions.FindAsync(
                        o => o.QuestionId == question.Id && o.IsCorrect);
                    var correctIdSet = allCorrectOptions.Select(o => o.Id).ToHashSet();

                    if (!string.IsNullOrEmpty(answer.SelectedOptionIds))
                    {
                        var selectedIdSet = answer.SelectedOptionIds.Split(',').Select(int.Parse).ToHashSet();
                        if (selectedIdSet.SetEquals(correctIdSet))
                        {
                            answer.PointsEarned = question.Points;
                            answer.IsCorrect = true;
                            totalScore += question.Points;
                        }
                        else
                        {
                            // Partial credit: points for correct - points for incorrect
                            int correctSelected = selectedIdSet.Intersect(correctIdSet).Count();
                            int incorrectSelected = selectedIdSet.Except(correctIdSet).Count();
                            decimal partialScore = Math.Max(0, 
                                question.Points * ((decimal)correctSelected / correctIdSet.Count) - 
                                (question.Points * (decimal)incorrectSelected / correctIdSet.Count));
                            answer.PointsEarned = Math.Round(partialScore, 2);
                            answer.IsCorrect = false;
                            totalScore += answer.PointsEarned.Value;
                        }
                    }
                    break;

                case QuestionType.ShortAnswer:
                    if (!string.IsNullOrEmpty(answer.TextAnswer) && !string.IsNullOrEmpty(question.CorrectShortAnswer))
                    {
                        var acceptableAnswers = question.CorrectShortAnswer.Split(',')
                            .Select(a => a.Trim());
                        
                        bool isCorrect = question.CaseSensitive
                            ? acceptableAnswers.Contains(answer.TextAnswer.Trim())
                            : acceptableAnswers.Any(a => 
                                a.Equals(answer.TextAnswer.Trim(), StringComparison.OrdinalIgnoreCase));

                        if (isCorrect)
                        {
                            answer.PointsEarned = question.Points;
                            answer.IsCorrect = true;
                            totalScore += question.Points;
                        }
                        else
                        {
                            answer.PointsEarned = 0;
                            answer.IsCorrect = false;
                        }
                    }
                    break;

                case QuestionType.Essay:
                    // Manual grading required
                    answer.PointsEarned = null;
                    answer.IsCorrect = null;
                    break;
            }

            // Only update if the answer has an ID (was already saved)
            if (answer.Id > 0)
            {
                await _unitOfWork.StudentAnswers.UpdateAsync(answer);
            }
        }

        attempt.Score = totalScore;
        attempt.MaxScore = maxScore;
        
        // Check if there are any ungraded questions (essay questions)
        var hasUngradedQuestions = false;
        foreach (var answer in answers)
        {
            var question = await _unitOfWork.Questions.GetByIdAsync(answer.QuestionId);
            if (question!.Type == QuestionType.Essay && answer.PointsEarned == null)
            {
                hasUngradedQuestions = true;
                break;
            }
        }
        
        // Only calculate percentage and pass/fail if all questions are graded
        if (hasUngradedQuestions)
        {
            attempt.Percentage = null;
            attempt.Passed = null;
        }
        else
        {
            attempt.Percentage = maxScore > 0 ? Math.Round((totalScore / maxScore) * 100, 2) : 0;
            var test = await _unitOfWork.Tests.GetByIdAsync(attempt.TestId);
            attempt.Passed = attempt.Percentage >= test!.PassingScore;
        }
    }

    public async Task<TestAttemptResponseDto> GetAttemptResultAsync(int attemptId, int userId)
    {
        var attempt = await _unitOfWork.TestAttempts.GetByIdAsync(attemptId);
        if (attempt == null)
            throw new NotFoundException("Test attempt not found");

        var test = await _unitOfWork.Tests.GetByIdAsync(attempt.TestId);
        var course = await _unitOfWork.Courses.GetByIdAsync(test!.CourseId);
        var student = await _unitOfWork.Users.GetByIdAsync(attempt.StudentId);

        bool isTeacher = course?.TeacherId == userId;
        bool isOwner = attempt.StudentId == userId;

        if (!isTeacher && !isOwner)
            throw new UnauthorizedException("You don't have access to this test attempt");

        // Students can only see results if test allows it
        if (!isTeacher && !test.ShowResultsImmediately && attempt.Status == TestAttemptStatus.Submitted)
            throw new BadRequestException("Results are not available yet");

        var answers = await _unitOfWork.StudentAnswers.FindAsync(a => a.TestAttemptId == attemptId);
        var answerDtos = new List<StudentAnswerResponseDto>();

        foreach (var answer in answers)
        {
            var question = await _unitOfWork.Questions.GetByIdAsync(answer.QuestionId);
            var allOptions = await _unitOfWork.AnswerOptions.FindAsync(o => o.QuestionId == question!.Id);
            var correctOptions = allOptions.Where(o => o.IsCorrect);

            bool showCorrectAnswers = isTeacher || (test.ShowCorrectAnswers && 
                (attempt.Status == TestAttemptStatus.Graded || attempt.Status == TestAttemptStatus.Submitted));

            answerDtos.Add(new StudentAnswerResponseDto
            {
                Id = answer.Id,
                QuestionId = question!.Id,
                QuestionText = question.QuestionText,
                QuestionType = question.Type,
                QuestionPoints = question.Points,
                SelectedOptionIds = !string.IsNullOrEmpty(answer.SelectedOptionIds)
                    ? answer.SelectedOptionIds.Split(',').Select(int.Parse).ToList()
                    : null,
                TextAnswer = answer.TextAnswer,
                PointsEarned = answer.PointsEarned,
                IsCorrect = answer.IsCorrect,
                Feedback = answer.Feedback,
                CorrectOptionIds = showCorrectAnswers ? correctOptions.Select(o => o.Id).ToList() : null,
                CorrectShortAnswer = showCorrectAnswers ? question.CorrectShortAnswer : null,
                Explanation = showCorrectAnswers ? question.Explanation : null,
                Options = allOptions.OrderBy(o => o.OrderIndex).Select(o => new AnswerOptionForReviewDto
                {
                    Id = o.Id,
                    OptionText = o.OptionText,
                    IsCorrect = showCorrectAnswers && o.IsCorrect
                }).ToList()
            });
        }

        User? gradedBy = null;
        if (attempt.GradedByUserId.HasValue)
            gradedBy = await _unitOfWork.Users.GetByIdAsync(attempt.GradedByUserId.Value);

        return new TestAttemptResponseDto
        {
            Id = attempt.Id,
            TestId = test.Id,
            TestTitle = test.Title,
            StudentId = student!.Id,
            StudentName = $"{student.FirstName} {student.LastName}",
            AttemptNumber = attempt.AttemptNumber,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            GradedAt = attempt.GradedAt,
            ExpiresAt = attempt.ExpiresAt,
            Score = attempt.Score,
            MaxScore = attempt.MaxScore,
            Percentage = attempt.Percentage,
            Passed = attempt.Passed,
            Status = attempt.Status,
            Feedback = attempt.Feedback,
            GradedBy = gradedBy != null ? $"{gradedBy.FirstName} {gradedBy.LastName}" : null,
            Answers = answerDtos
        };
    }

    public async Task<IEnumerable<TestAttemptResponseDto>> GetMyAttemptsAsync(int userId, int? testId = null)
    {
        var attempts = testId.HasValue
            ? await _unitOfWork.TestAttempts.FindAsync(a => a.StudentId == userId && a.TestId == testId.Value)
            : await _unitOfWork.TestAttempts.FindAsync(a => a.StudentId == userId);

        var result = new List<TestAttemptResponseDto>();
        foreach (var attempt in attempts.OrderByDescending(a => a.StartedAt))
        {
            try
            {
                result.Add(await GetAttemptResultAsync(attempt.Id, userId));
            }
            catch
            {
                // Skip attempts the user can't access
            }
        }

        return result;
    }

    #endregion

    #region Grading

    public async Task<IEnumerable<TestAttemptResponseDto>> GetTestAttemptsAsync(int userId, int testId)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only view attempts for your own tests");

        var attempts = await _unitOfWork.TestAttempts.FindAsync(a => a.TestId == testId);

        var result = new List<TestAttemptResponseDto>();
        foreach (var attempt in attempts.OrderByDescending(a => a.SubmittedAt ?? a.StartedAt))
        {
            result.Add(await GetAttemptResultAsync(attempt.Id, userId));
        }

        return result;
    }

    public async Task<TestAttemptResponseDto> GradeAttemptAsync(int userId, GradeAttemptDto gradeDto)
    {
        var attempt = await _unitOfWork.TestAttempts.GetByIdAsync(gradeDto.AttemptId);
        if (attempt == null)
            throw new NotFoundException("Test attempt not found");

        var test = await _unitOfWork.Tests.GetByIdAsync(attempt.TestId);
        var course = await _unitOfWork.Courses.GetByIdAsync(test!.CourseId);

        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only grade attempts for your own tests");

        // Grade individual answers
        foreach (var grade in gradeDto.Grades)
        {
            var answer = await _unitOfWork.StudentAnswers.GetByIdAsync(grade.StudentAnswerId);
            if (answer == null || answer.TestAttemptId != attempt.Id)
                continue;

            var question = await _unitOfWork.Questions.GetByIdAsync(answer.QuestionId);
            answer.PointsEarned = Math.Min(grade.PointsEarned, question!.Points);
            answer.IsCorrect = answer.PointsEarned == question.Points;
            answer.Feedback = grade.Feedback;

            await _unitOfWork.StudentAnswers.UpdateAsync(answer);
        }

        await _unitOfWork.SaveChangesAsync();

        // Recalculate total score
        var allAnswers = await _unitOfWork.StudentAnswers.FindAsync(a => a.TestAttemptId == attempt.Id);
        var questions = await _unitOfWork.Questions.FindAsync(q => q.TestId == test.Id && q.IsActive);

        decimal totalScore = allAnswers.Where(a => a.PointsEarned.HasValue).Sum(a => a.PointsEarned!.Value);
        decimal maxScore = questions.Sum(q => q.Points);

        attempt.Score = totalScore;
        attempt.MaxScore = maxScore;
        attempt.Percentage = maxScore > 0 ? Math.Round((totalScore / maxScore) * 100, 2) : 0;
        attempt.Passed = attempt.Percentage >= test.PassingScore;
        attempt.Feedback = gradeDto.Feedback;
        attempt.GradedByUserId = userId;
        attempt.GradedAt = DateTime.UtcNow;
        attempt.Status = TestAttemptStatus.Graded;

        await _unitOfWork.TestAttempts.UpdateAsync(attempt);
        await _unitOfWork.SaveChangesAsync();

        // Send real-time notification to the student
        if (_notificationService != null)
        {
            try
            {
                await _notificationService.NotifyTestGradedAsync(
                    attempt.StudentId,
                    test.Id,
                    test.Title,
                    attempt.Id,
                    attempt.Score,
                    attempt.MaxScore,
                    attempt.Percentage,
                    attempt.Passed
                );
            }
            catch
            {
                // Notification failure shouldn't break the grading
            }
        }

        return await GetAttemptResultAsync(attempt.Id, userId);
    }

    public async Task<TestSummaryDto> GetTestSummaryAsync(int userId, int testId)
    {
        var test = await _unitOfWork.Tests.GetByIdAsync(testId);
        if (test == null)
            throw new NotFoundException("Test not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(test.CourseId);
        if (course?.TeacherId != userId)
            throw new UnauthorizedException("You can only view summaries for your own tests");

        var attempts = await _unitOfWork.TestAttempts.FindAsync(
            a => a.TestId == testId && (a.Status == TestAttemptStatus.Submitted || a.Status == TestAttemptStatus.Graded));
        var attemptsList = attempts.ToList();

        var gradedAttempts = attemptsList.Where(a => a.Percentage.HasValue).ToList();

        return new TestSummaryDto
        {
            TestId = test.Id,
            TestTitle = test.Title,
            TotalAttempts = attemptsList.Count,
            UniqueStudents = attemptsList.Select(a => a.StudentId).Distinct().Count(),
            AverageScore = gradedAttempts.Any() ? Math.Round(gradedAttempts.Average(a => a.Percentage!.Value), 2) : 0,
            HighestScore = gradedAttempts.Any() ? gradedAttempts.Max(a => a.Percentage!.Value) : 0,
            LowestScore = gradedAttempts.Any() ? gradedAttempts.Min(a => a.Percentage!.Value) : 0,
            PassedCount = gradedAttempts.Count(a => a.Passed == true),
            FailedCount = gradedAttempts.Count(a => a.Passed == false),
            PassRate = gradedAttempts.Any() 
                ? Math.Round((decimal)gradedAttempts.Count(a => a.Passed == true) / gradedAttempts.Count * 100, 2) 
                : 0
        };
    }

    #endregion
}

