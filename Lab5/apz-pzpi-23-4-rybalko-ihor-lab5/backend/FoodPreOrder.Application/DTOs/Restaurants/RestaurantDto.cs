using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Restaurants
{
    public class RestaurantDto
    {
        public int Id { get; set; }
        public string NameUA { get; set; } = string.Empty;
        public string NameEN { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsActive { get; set; }
        public DateTime PaidUntil { get; set; }
        public int OwnerId { get; set; }
        public OwnerDto? Owner { get; set; }
    }
}
