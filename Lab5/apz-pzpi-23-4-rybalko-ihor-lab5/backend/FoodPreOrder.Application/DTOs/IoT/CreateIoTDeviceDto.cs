using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.IoT
{
    public class CreateIoTDeviceDto
    {
        [Required]
        public string SerialNumber { get; set; } = string.Empty;

        [Required]
        public string LocationName { get; set; } = string.Empty;

        [Required]
        public int RestaurantId { get; set; }
    }
}
