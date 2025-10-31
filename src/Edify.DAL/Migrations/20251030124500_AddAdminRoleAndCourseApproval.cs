using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edify.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminRoleAndCourseApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Courses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovedByAdminId",
                table: "Courses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Courses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Courses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Courses_ApprovedByAdminId",
                table: "Courses",
                column: "ApprovedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Courses_Users_ApprovedByAdminId",
                table: "Courses",
                column: "ApprovedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Courses_Users_ApprovedByAdminId",
                table: "Courses");

            migrationBuilder.DropIndex(
                name: "IX_Courses_ApprovedByAdminId",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ApprovedByAdminId",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Courses");
        }
    }
}
