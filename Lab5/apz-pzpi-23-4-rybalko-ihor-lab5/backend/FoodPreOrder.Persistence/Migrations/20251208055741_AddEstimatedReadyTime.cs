using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPreOrder.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEstimatedReadyTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EstimatedReadyTime",
                table: "Orders",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstimatedReadyTime",
                table: "Orders");
        }
    }
}
