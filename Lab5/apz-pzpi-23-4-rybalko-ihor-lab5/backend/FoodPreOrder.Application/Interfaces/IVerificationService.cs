using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.Interfaces
{
    public interface IVerificationService
    {
        Task SubmitRequestAsync(int userId, IFormFile document);
        Task<List<VerificationRequest>> GetPendingRequestsAsync();
        Task<bool> ProcessRequestAsync(int adminId, ProcessVerificationDto dto);
    }
}
