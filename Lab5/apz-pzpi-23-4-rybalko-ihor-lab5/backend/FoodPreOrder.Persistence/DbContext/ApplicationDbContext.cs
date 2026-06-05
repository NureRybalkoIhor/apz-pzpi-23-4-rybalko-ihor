using FoodPreOrder.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace FoodPreOrder.Persistence.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Dish> Dishes { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<IoTDevice> IoTDevices { get; set; }

        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<RestaurantDailyStat> RestaurantDailyStats { get; set; }
        public DbSet<VerificationRequest> VerificationRequests { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            modelBuilder.Entity<Restaurant>()
                .HasOne(r => r.Owner)
                .WithMany(u => u.OwnedRestaurants)
                .HasForeignKey(r => r.OwnerId)
                .OnDelete(DeleteBehavior.Restrict); 

            modelBuilder.Entity<User>()
                .HasOne(u => u.Restaurant)
                .WithMany()
                .HasForeignKey(u => u.RestaurantId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<RestaurantDailyStat>(entity =>
            {
                entity.Property(e => e.TotalRevenue)
                      .HasColumnType("decimal(18,2)");

                entity.HasIndex(e => new { e.RestaurantId, e.Date });
            });

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.Property(e => e.Amount)
                      .HasColumnType("decimal(18,2)");

                entity.HasIndex(e => e.ExternalTransactionId);
            });

            modelBuilder.Entity<ActivityLog>(entity =>
            {
                entity.HasIndex(e => e.Timestamp);
            });

            modelBuilder.Entity<SystemSetting>(entity =>
            {
                entity.HasIndex(e => e.Key).IsUnique();
            });
        }
    }
}
