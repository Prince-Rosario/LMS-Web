using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edify.DAL.Migrations
{
    /// <inheritdoc />
    public partial class MakeFileUrlNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FileUrl",
                table: "Materials",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FileUrl",
                table: "Materials",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                defaultValue: "");
        }
    }
}
