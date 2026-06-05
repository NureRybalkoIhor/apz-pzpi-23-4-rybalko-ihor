using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Admin
{
    public class SubmitVerificationDto
    {
        public IFormFile Document { get; set; }
    }
}
