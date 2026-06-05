using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class IoTDevice
    {
        public int Id { get; set; }

        public string SerialNumber { get; set; } = string.Empty;

        public string LocationName { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime? LastPing { get; set; }

        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }
    }
}
