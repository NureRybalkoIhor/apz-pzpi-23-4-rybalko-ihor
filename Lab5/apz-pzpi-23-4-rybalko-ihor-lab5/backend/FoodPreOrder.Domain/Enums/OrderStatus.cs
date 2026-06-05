using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Enums
{
    public enum OrderStatus
    {
        Pending = 0,
        Paid = 1,
        Cooking = 2,
        Ready = 3,
        Completed = 4,
        Cancelled = 5
    }
}
