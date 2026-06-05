using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Admin
{
    public class ProcessVerificationDto
    {
        public int RequestId { get; set; }
        public bool IsApproved { get; set; }
        public string? Comment { get; set; }
    }
}
