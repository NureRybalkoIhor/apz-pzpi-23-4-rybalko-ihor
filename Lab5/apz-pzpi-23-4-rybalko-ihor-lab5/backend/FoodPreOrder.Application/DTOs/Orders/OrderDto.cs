using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Orders
{
    public class OrderDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime VisitTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string? Comment { get; set; }

        public int RestaurantId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;

        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }
}
