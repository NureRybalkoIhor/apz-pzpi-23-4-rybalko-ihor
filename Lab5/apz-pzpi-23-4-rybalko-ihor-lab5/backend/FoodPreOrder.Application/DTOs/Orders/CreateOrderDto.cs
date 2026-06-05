using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Orders
{
    public class CreateOrderDto
    {
        [Required(ErrorMessage = "Необхідно вказати ресторан")]
        public int RestaurantId { get; set; }

        [Required(ErrorMessage = "Необхідно вказати час візиту")]
        public DateTime VisitTime { get; set; }

        [MaxLength(500, ErrorMessage = "Коментар не може перевищувати 500 символів")]
        public string? Comment { get; set; }

        [Required(ErrorMessage = "Список страв не може бути порожнім")]
        public List<CreateOrderItemDto> Items { get; set; } = new List<CreateOrderItemDto>();
    }
}
