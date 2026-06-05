using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class Transaction
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public Order? Order { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "UAH";

        public string Status { get; set; } = "Success";

        public string PaymentMethod { get; set; } = "Card";

        public string ExternalTransactionId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
