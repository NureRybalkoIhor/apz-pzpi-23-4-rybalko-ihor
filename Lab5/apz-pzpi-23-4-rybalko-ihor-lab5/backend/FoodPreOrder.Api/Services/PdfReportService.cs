using FoodPreOrder.Application.DTOs.Admin;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FoodPreOrder.Api.Services
{
    public class PdfReportService
    {
        public PdfReportService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GenerateFinancialReport(string restaurantName, DateTime from, DateTime to, List<DailyStatsDto> stats)
        {
            return CreateDocument(restaurantName, $"Фінансовий Звіт ({from:dd.MM} - {to:dd.MM})", container =>
            {
                container.Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(80);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderStyle).Text("Дата");
                        header.Cell().Element(HeaderStyle).Text("Замовлення");
                        header.Cell().Element(HeaderStyle).Text("Сер. чек");
                        header.Cell().Element(HeaderStyle).Text("Виручка").AlignRight();
                    });

                    foreach (var item in stats)
                    {
                        table.Cell().Element(CellStyle).Text($"{item.Date:dd.MM.yyyy}");
                        table.Cell().Element(CellStyle).Text($"{item.OrdersCount}");
                        table.Cell().Element(CellStyle).Text($"{item.AverageCheck:F2}");
                        table.Cell().Element(CellStyle).Text($"{item.Revenue:F2}").Bold().AlignRight();
                    }

                    table.Footer(footer =>
                    {
                        footer.Cell().ColumnSpan(4).Element(CellStyle).Text($"ЗАГАЛОМ: {stats.Sum(x => x.Revenue):F2} грн").Bold().AlignRight();
                    });
                });
            });
        }

        public byte[] GenerateDailyLogReport(string restaurantName, DateTime date, List<OrderLogDto> logs)
        {
            return CreateDocument(restaurantName, $"Операційний журнал за {date:dd.MM.yyyy}", container =>
            {
                container.Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(50);
                        columns.ConstantColumn(100);
                        columns.RelativeColumn();
                        columns.ConstantColumn(60);
                        columns.ConstantColumn(70);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderStyle).Text("Час");
                        header.Cell().Element(HeaderStyle).Text("Клієнт");
                        header.Cell().Element(HeaderStyle).Text("Замовлення");
                        header.Cell().Element(HeaderStyle).Text("Сума");
                        header.Cell().Element(HeaderStyle).Text("Статус");
                    });

                    foreach (var item in logs)
                    {
                        table.Cell().Element(CellStyle).Text($"{item.Time:HH:mm}");
                        table.Cell().Element(CellStyle).Text(item.CustomerName);
                        table.Cell().Element(CellStyle).Text(item.ItemsSummary).FontSize(9);
                        table.Cell().Element(CellStyle).Text($"{item.TotalAmount:F0}");

                        string statusColor = item.Status == "Completed" ? Colors.Green.Medium :
                                             item.Status == "Cancelled" ? Colors.Red.Medium : Colors.Grey.Darken1;

                        table.Cell().Element(CellStyle).Text(item.Status).FontColor(statusColor).Bold();
                    }
                });
            });
        }

        public byte[] GeneratePeakHoursReport(string restaurantName, List<PeakLoadDto> peaks)
        {
            return CreateDocument(restaurantName, "Аналіз навантаження (Peak Hours)", container =>
            {
                container.Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(60);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderStyle).Text("Година");
                        header.Cell().Element(HeaderStyle).Text("Кількість замовлень");
                        header.Cell().Element(HeaderStyle).Text("Інтенсивність");
                    });

                    foreach (var item in peaks)
                    {
                        table.Cell().Element(CellStyle).Text($"{item.Hour}:00 - {item.Hour + 1}:00");
                        table.Cell().Element(CellStyle).Text($"{item.OrdersCount}");
                        table.Cell().Element(CellStyle).Text(item.Intensity);
                    }
                });
            });
        }

        public byte[] GenerateSystemDashboardReport(AdminDashboardDto data)
        {
            return CreateDocument("FoodPreOrder Business Intelligence", $"Аналітичний зріз на {DateTime.Now:dd.MM.yyyy HH:mm}", container =>
            {
                container.Column(column =>
                {
                    column.Item().PaddingBottom(20).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Користувачів: {data.TotalUsers}").FontSize(14);
                            c.Item().Text($"Активних закладів: {data.ActiveRestaurants}").FontSize(14);
                        });

                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text("Загальний обіг:").FontColor(Colors.Grey.Darken1);
                            c.Item().Text($"{data.TotalSystemRevenue:N0} грн")
                                .FontSize(24).Bold().FontColor(Colors.Green.Darken2);
                        });
                    });

                    column.Item().LineHorizontal(2).LineColor(Colors.Grey.Lighten2);
                    column.Item().PaddingBottom(20);

                    column.Item().PaddingBottom(10).Text("Ефективність ресторанів").FontSize(16).SemiBold();

                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderStyle).Text("Ресторан");
                            header.Cell().Element(HeaderStyle).Text("Staff").AlignCenter();
                            header.Cell().Element(HeaderStyle).Text("Чеки").AlignRight();
                            header.Cell().Element(HeaderStyle).Text("Виручка").AlignRight();
                            header.Cell().Element(HeaderStyle).Text("Частка").AlignRight();
                        });

                        foreach (var rest in data.RestaurantStats)
                        {
                            table.Cell().Element(CellStyle).Text(rest.RestaurantName).Bold();

                            var staffColor = (rest.StaffCount < 2 && rest.Revenue > 0) ? Colors.Red.Medium : Colors.Black;
                            table.Cell().Element(CellStyle).Text($"{rest.StaffCount}").FontColor(staffColor).AlignCenter();

                            table.Cell().Element(CellStyle).Text($"{rest.OrdersCount}").AlignRight();
                            table.Cell().Element(CellStyle).Text($"{rest.Revenue:N0}").AlignRight();

                            var shareColor = rest.RevenueShare > 20 ? Colors.Green.Darken2 : Colors.Grey.Darken2;
                            table.Cell().Element(CellStyle).Text($"{rest.RevenueShare:F1}%").FontColor(shareColor).Bold().AlignRight();
                        }

                        table.Footer(footer =>
                        {
                            footer.Cell().ColumnSpan(5).Element(CellStyle).Text("* Staff червоним = можливо не вистачає персоналу").FontSize(9).FontColor(Colors.Grey.Medium).Italic();
                        });
                    });
                });
            });
        }

        public byte[] GenerateTopDishesReport(string restaurantName, List<TopDishDto> dishes)
        {
            return CreateDocument(restaurantName, "Топ продажів (Top Dishes)", container =>
            {
                container.Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.RelativeColumn();
                        columns.ConstantColumn(60);
                        columns.ConstantColumn(80);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderStyle).Text("#");
                        header.Cell().Element(HeaderStyle).Text("Страва");
                        header.Cell().Element(HeaderStyle).Text("Продано");
                        header.Cell().Element(HeaderStyle).Text("Виручка").AlignRight();
                    });

                    int rank = 1;
                    foreach (var item in dishes)
                    {
                        table.Cell().Element(CellStyle).Text($"{rank++}");
                        table.Cell().Element(CellStyle).Text(item.Name);
                        table.Cell().Element(CellStyle).Text($"{item.SoldCount} шт.");
                        table.Cell().Element(CellStyle).Text($"{item.TotalRevenue:F2}").AlignRight();
                    }
                });
            });
        }

        private byte[] CreateDocument(string restaurantName, string title, Action<IContainer> content)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                    page.Header().Text(text =>
                    {
                        text.Span(title).SemiBold().FontSize(18).FontColor(Colors.Blue.Medium);
                        text.Span($"\n{restaurantName}").FontSize(12).FontColor(Colors.Grey.Darken2);
                    });

                    page.Content().PaddingVertical(1, Unit.Centimetre).Element(content);

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Згенеровано FoodPreOrder | Сторінка ");
                        x.CurrentPageNumber();
                    });
                });
            });
            return document.GeneratePdf();
        }

        static IContainer HeaderStyle(IContainer container)
        {
            return container.DefaultTextStyle(x => x.SemiBold())
                            .BorderBottom(1).BorderColor(Colors.Grey.Darken2).PaddingVertical(5);
        }

        static IContainer CellStyle(IContainer container)
        {
            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
        }
    }
}
