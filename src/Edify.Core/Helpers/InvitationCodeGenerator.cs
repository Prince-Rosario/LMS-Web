namespace Edify.Core.Helpers;

public static class InvitationCodeGenerator
{
    private const string Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    public static string Generate(int length = 8)
    {
        var random = new Random();
        return new string(Enumerable.Range(0, length)
            .Select(_ => Characters[random.Next(Characters.Length)])
            .ToArray());
    }
}




