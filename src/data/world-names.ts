// A small cross-cultural sampling of first names, grouped by region of origin.
// Passed to the speech recognizer as vocabulary-bias hints (`contextualStrings`)
// so that names spoken in a journal entry — including names that don't follow
// English phonetic patterns — have a better chance of being transcribed
// correctly rather than mangled into the nearest English-sounding word.
const WORLD_NAMES_BY_REGION: Record<string, string[]> = {
  eastAsian: [
    'Wei', 'Jun', 'Mei', 'Li', 'Min', 'Yuki', 'Haruto', 'Sakura', 'Hana',
    'Ren', 'Jin', 'Soo-ah', 'Min-jun', 'Ji-woo', 'Hyun', 'Eun-ji', 'Tae-yang',
    'Xin', 'Yan', 'Feng', 'Ling', 'Chen', 'Akira', 'Naoko', 'Kenji',
  ],
  southAsian: [
    'Aarav', 'Vihaan', 'Ananya', 'Diya', 'Ishaan', 'Priya', 'Rohan', 'Saanvi',
    'Arjun', 'Kavya', 'Aditya', 'Meera', 'Rahul', 'Neha', 'Vikram', 'Pooja',
    'Imran', 'Ayesha', 'Zara', 'Bilal', 'Sana', 'Tariq', 'Nadia', 'Faisal',
  ],
  southeastAsian: [
    'Nguyen', 'Linh', 'Minh', 'Anh', 'Trang', 'Somchai', 'Niran', 'Mai',
    'Putri', 'Budi', 'Siti', 'Wayan', 'Mark', 'Joy', 'Liwayway', 'Bayani',
  ],
  middleEastern: [
    'Omar', 'Layla', 'Yusuf', 'Amira', 'Hassan', 'Fatima', 'Karim', 'Noor',
    'Ali', 'Sara', 'Reza', 'Niloofar', 'Mehmet', 'Elif', 'Cem', 'Aylin',
  ],
  african: [
    'Amara', 'Kwame', 'Zola', 'Tendai', 'Chidi', 'Ngozi', 'Ade', 'Folake',
    'Amani', 'Kofi', 'Aisha', 'Sade', 'Thabo', 'Naledi', 'Hawi', 'Selam',
  ],
  european: [
    'Liam', 'Olivia', 'Noah', 'Emma', 'Lucas', 'Sofia', 'Mateus', 'Ines',
    'Luca', 'Giulia', 'Hans', 'Greta', 'Pierre', 'Camille', 'Bjorn', 'Astrid',
    'Dimitri', 'Katarina', 'Ivan', 'Olena', 'Aoife', 'Sean', 'Mairead', 'Rhys',
  ],
  latinAmerican: [
    'Mateo', 'Sofia', 'Santiago', 'Valentina', 'Diego', 'Camila', 'Gabriel',
    'Lucia', 'Joaquin', 'Isabella', 'Andres', 'Renata', 'Mariana', 'Tomas',
  ],
  oceaniaIndigenous: [
    'Kai', 'Moana', 'Tane', 'Aroha', 'Manaia', 'Nikau', 'Amaru', 'Tupac',
  ],
};

export const WORLD_NAMES: string[] = Array.from(
  new Set(Object.values(WORLD_NAMES_BY_REGION).flat()),
);
