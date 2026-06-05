using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class Dish
    {
        public int Id { get; set; }
        public string NameUA { get; set; } = string.Empty;
        public string NameEN { get; set; } = string.Empty;
        public string DescriptionUA { get; set; } = string.Empty;
        public string DescriptionEN { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public int PreparationTimeMinutes { get; set; }
        public bool IsAvailable { get; set; } = true;
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
