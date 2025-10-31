using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edify.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddFileUploadSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "Materials",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Materials",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Materials",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "Materials",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsExternalLink",
                table: "Materials",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "IsExternalLink",
                table: "Materials");
        }
    }
}
