using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class Restaurant
    {
        public int Id { get; set; }
        public string NameUA { get; set; } = string.Empty;
        public string NameEN { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsActive { get; set; } = true;
        public int OwnerId { get; set; }
        public User? Owner { get; set; }
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime PaidUntil { get; set; } = DateTime.UtcNow.AddDays(14);
        public ICollection<Category> Categories { get; set; } = new List<Category>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<IoTDevice> IoTDevices { get; set; } = new List<IoTDevice>();
    }
}
