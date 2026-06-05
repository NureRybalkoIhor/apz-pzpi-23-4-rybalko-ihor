using FoodPreOrder.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Admin
{
    public class ChangeRoleDto
    {
        public int UserId { get; set; }
        public UserRole NewRole { get; set; }
    }
}
