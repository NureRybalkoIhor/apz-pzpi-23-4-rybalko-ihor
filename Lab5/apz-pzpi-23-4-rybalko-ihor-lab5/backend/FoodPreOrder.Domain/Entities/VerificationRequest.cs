using FoodPreOrder.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class VerificationRequest
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public string DocumentUrl { get; set; } = string.Empty;

        public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

        public string? AdminComment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
    }
}
