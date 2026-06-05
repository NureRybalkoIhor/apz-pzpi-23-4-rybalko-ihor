using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Restaurants
{
    public class CreateRestaurantDto
    {
        [Required(ErrorMessage = "Назва закладу є обов'язковою")]
        [MaxLength(100, ErrorMessage = "Назва занадто довга")]
        public string NameUA { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string NameEN { get; set; } = string.Empty;

        [Required(ErrorMessage = "Адреса є обов'язковою")]
        [MaxLength(200, ErrorMessage = "Адреса занадто довга")]
        public string Address { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        [Range(-90, 90, ErrorMessage = "Широта має бути від -90 до 90")]
        public double Latitude { get; set; }

        [Range(-180, 180, ErrorMessage = "Довгота має бути від -180 до 180")]
        public double Longitude { get; set; }

        [Required]
        public int OwnerId { get; set; }
    }
}
