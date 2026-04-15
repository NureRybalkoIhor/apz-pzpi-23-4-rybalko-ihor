/* В.1 Довідка щодо генерації кодової реалізації підсистеми за допомогою ШІ
 
 Промпт: «Дій як Middle C# Developer. Згенеруй класи підсистеми (база даних, 
 рушій нарахування балів, сервіс пуш-сповіщень) для застосунку трекінгу звичок. 
 Класи повинні бути незалежними, дотримуватись SRP та не мати складних 
 залежностей, щоб в подальшому продемонструвати їх об'єднання через 
 патерн Facade. Зроби код максимально коротким.»
*/ 

// Результат (приклад програмного коду)

public class DatabaseContext {
    public void SaveProgress(int habitId) { 
        /* SQL UPDATE... */ 
    }
}

public class GamificationEngine {
    public int CalculateXP() { return 50; }
    public void AddXP(int userId, int xp) { 
        /* Нарахування балів... */ 
    }
}

public class NotificationService {
    public void SendPush(int userId, string msg) { 
        /* Відправка через Firebase/APNs... */ 
    }
}

/* В.2 Довідка щодо генерації кодової реалізації класу-Фасаду за допомогою ШІ
 
 Промпт: «Дій як Software Architect. На основі створених підсистем 
 (DatabaseContext, GamificationEngine, NotificationService) 
 напиши клас HabitTrackerFacade мовою C#. Цей клас повинен 
 мати один публічний метод CompleteDailyHabit, який ховає в собі 
 послідовний виклик методів підсистем. Продемонструй принцип диригента.»
*/ 

// Результат (приклад програмного коду)

public class HabitTrackerFacade 
{
    private DatabaseContext _db = new DatabaseContext();
    private GamificationEngine _game = new GamificationEngine();
    private NotificationService _notify = new NotificationService();

    public void CompleteDailyHabit(int userId, int habitId) 
    {
        _db.SaveProgress(habitId);
        
        int xp = _game.CalculateXP();
        _game.AddXP(userId, xp);
        
        _notify.SendPush(userId, $"Звичку виконано! +{xp} XP");
    }
}

/* В.3 Довідка щодо генерації кодової реалізації клієнтського виклику за допомогою ШІ
 
 Промпт: «Дій як Backend .NET Developer. Напиши приклад клієнтського коду у 
 вигляді API-контролера (HabitController), який використовує створений раніше 
 HabitTrackerFacade для обробки запиту користувача. Продемонструй, як виклик 
 складної трикрокової транзакції тепер зводиться до одного рядка коду.»
*/ 

// Результат (приклад програмного коду)

public class HabitController 
{
    private HabitTrackerFacade _facade;

    public HabitController() {
        _facade = new HabitTrackerFacade(); 
    }

    public void OnUserClickedComplete(int userId, int habitId) 
    {
        _facade.CompleteDailyHabit(userId, habitId);
    }
}