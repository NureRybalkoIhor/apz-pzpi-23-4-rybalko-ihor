using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Admin
{
    public class BlockUserDto
    {
        public int UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
