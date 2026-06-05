using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Orders
{
    public class CreateOrderItemDto
    {
        [Required(ErrorMessage = "Необхідно вказати страву (ID)")]
        public int DishId { get; set; }

        [Required]
        [Range(1, 100, ErrorMessage = "Кількість має бути від 1 до 100")]
        public int Quantity { get; set; }
    }
}
