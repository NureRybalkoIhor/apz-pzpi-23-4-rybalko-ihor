using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Restaurants
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string NameUA { get; set; } = string.Empty;
        public string NameEN { get; set; } = string.Empty;
        public int RestaurantId { get; set; }
    }
}
