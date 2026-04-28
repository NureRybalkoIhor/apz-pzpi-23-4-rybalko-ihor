;; В.1 Довідка щодо генерації фрагмента коду управління станом (Atoms)
;; Демонстрація безпечного оновлення документа в пам'яті сервера
(defonce current-document (atom {:shapes [] :selected nil}))

(defn add-shape-to-doc [new-shape]
  ;; Функція swap! гарантує атомарне (безпечне) оновлення 
  ;; незмінної структури даних при конкурентних запитах
  (swap! current-document update :shapes conj new-shape))

;; В.2Довідка щодо генерації фрагмента коду подієвої синхронізації (Pub/Sub)
;; Демонстрація публікації оновлень макета
(defn broadcast-update [project-id event-data]
  ;; Сервер публікує подію в канал конкретного проєкту через Redis
  (redis/publish! (str "project-channel:" project-id)
                  {:type :remote-update
                   :timestamp (current-time)
                   :payload event-data}))

;; В.3 Довідка щодо генерації фрагмента коду реактивного UI (SVG as DOM)
;; Демонстрація створення візуального компонента (Frontend)
(defn rectangle-component [shape-data]
  ;; Компонент автоматично перемальовується при зміні shape-data.
  ;; Відтворення відбувається через нативні теги SVG.
  [:g.shape-group
    [:rect {:x (:x shape-data)
            :y (:y shape-data)
            :width (:width shape-data)
            :height (:height shape-data)
            :fill (:color shape-data)}]])