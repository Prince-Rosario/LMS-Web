using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Edify.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddBase64FileStorageToMaterials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsExternalLink",
                table: "Materials");

            migrationBuilder.RenameColumn(
                name: "FilePath",
                table: "Materials",
                newName: "FileDataBase64");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FileDataBase64",
                table: "Materials",
                newName: "FilePath");

            migrationBuilder.AddColumn<bool>(
                name: "IsExternalLink",
                table: "Materials",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
