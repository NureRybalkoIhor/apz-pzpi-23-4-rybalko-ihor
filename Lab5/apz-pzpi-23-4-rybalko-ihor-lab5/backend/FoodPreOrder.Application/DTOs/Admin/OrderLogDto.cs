using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Admin
{
    public class OrderLogDto
    {
        public int OrderId { get; set; }
        public DateTime Time { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ItemsSummary { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
