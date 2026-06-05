using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodPreOrder.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixOrderFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PickupTime",
                table: "Orders",
                newName: "VisitTime");

            migrationBuilder.RenameColumn(
                name: "PriceAtMoment",
                table: "OrderItems",
                newName: "Price");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VisitTime",
                table: "Orders",
                newName: "PickupTime");

            migrationBuilder.RenameColumn(
                name: "Price",
                table: "OrderItems",
                newName: "PriceAtMoment");
        }
    }
}
