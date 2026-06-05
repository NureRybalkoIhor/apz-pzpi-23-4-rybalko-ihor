using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class Category
    {
        public int Id { get; set; }
        public string NameUA { get; set; } = string.Empty;
        public string NameEN { get; set; } = string.Empty;
        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }
        public ICollection<Dish> Dishes { get; set; } = new List<Dish>();
    }
}
