using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Restaurants
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Назва українською є обов'язковою")]
        [MaxLength(100, ErrorMessage = "Назва занадто довга")]
        public string NameUA { get; set; } = string.Empty;

        [Required(ErrorMessage = "Назва англійською є обов'язковою")]
        [MaxLength(100, ErrorMessage = "Назва занадто довга")]
        public string NameEN { get; set; } = string.Empty;

        [Required]
        public int RestaurantId { get; set; }
    }
}
