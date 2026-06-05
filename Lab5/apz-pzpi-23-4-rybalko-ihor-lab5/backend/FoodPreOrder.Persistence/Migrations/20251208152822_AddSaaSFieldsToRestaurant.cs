using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPreOrder.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSaaSFieldsToRestaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PaidUntil",
                table: "Restaurants",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "RegisteredAt",
                table: "Restaurants",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaidUntil",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "RegisteredAt",
                table: "Restaurants");
        }
    }
}
