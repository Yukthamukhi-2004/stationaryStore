export interface ProductItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

const placeholder = (text: string) =>
  `https://placehold.co/200x200/F5F0EB/2c2420?text=${encodeURIComponent(text)}`;

export const notebookProducts: ProductItem[] = [
  { id: 101, name: "Single Ruled Book", price: 45, image: placeholder("Single+Ruled"), category: "notebooks" },
  { id: 102, name: "Double Ruled Book", price: 50, image: placeholder("Double+Ruled"), category: "notebooks" },
  { id: 103, name: "Plain Pages Book", price: 40, image: placeholder("Plain+Pages"), category: "notebooks" },
  { id: 104, name: "Long Book", price: 60, image: placeholder("Long+Book"), category: "notebooks" },
  { id: 105, name: "Short Book", price: 35, image: placeholder("Short+Book"), category: "notebooks" },
  { id: 106, name: "100 Pages Book", price: 55, image: placeholder("100+Pages"), category: "notebooks" },
  { id: 107, name: "200 Pages Book", price: 75, image: placeholder("200+Pages"), category: "notebooks" },
  { id: 108, name: "500 Pages Book", price: 120, image: placeholder("500+Pages"), category: "notebooks" },
  { id: 109, name: "Color Charts", price: 30, image: placeholder("Color+Charts"), category: "notebooks" },
  { id: 110, name: "Plain White Charts", price: 25, image: placeholder("White+Charts"), category: "notebooks" },
  { id: 111, name: "A4 Sheet Pack", price: 20, image: placeholder("A4+Sheet"), category: "notebooks" },
  { id: 112, name: "A3 Sheet Pack", price: 35, image: placeholder("A3+Sheet"), category: "notebooks" },
  { id: 113, name: "A1 Sheet Pack", price: 50, image: placeholder("A1+Sheet"), category: "notebooks" },
];

export const accessoriesProducts: ProductItem[] = [
  { id: 201, name: "Marker", price: 30, image: placeholder("Marker"), category: "accessories" },
  { id: 202, name: "Ball Pen", price: 15, image: placeholder("Ball+Pen"), category: "accessories" },
  { id: 203, name: "Gel Pen", price: 25, image: placeholder("Gel+Pen"), category: "accessories" },
  { id: 204, name: "Pencil", price: 10, image: placeholder("Pencil"), category: "accessories" },
  { id: 205, name: "Eraser", price: 8, image: placeholder("Eraser"), category: "accessories" },
  { id: 206, name: "Sharpener", price: 12, image: placeholder("Sharpener"), category: "accessories" },
  { id: 207, name: "Scale", price: 18, image: placeholder("Scale"), category: "accessories" },
  { id: 208, name: "Geometry Box", price: 85, image: placeholder("Geometry+Box"), category: "accessories" },
];

export const booksProducts: ProductItem[] = [
  { id: 301, name: "Novels", price: 250, image: placeholder("Novels"), category: "books" },
  { id: 302, name: "Fictional Books", price: 220, image: placeholder("Fictional"), category: "books" },
  { id: 303, name: "Anime Books", price: 300, image: placeholder("Anime"), category: "books" },
  { id: 304, name: "Text Books", price: 350, image: placeholder("Text+Books"), category: "books" },
  { id: 305, name: "Science Books", price: 400, image: placeholder("Science"), category: "books" },
  { id: 306, name: "Poetry Books", price: 180, image: placeholder("Poetry"), category: "books" },
  { id: 307, name: "Diary", price: 120, image: placeholder("Diary"), category: "books" },
  { id: 308, name: "Journals", price: 150, image: placeholder("Journals"), category: "books" },
];

export const artMaterialsProducts: ProductItem[] = [
  { id: 401, name: "Crayons", price: 45, image: placeholder("Crayons"), category: "art-materials" },
  { id: 402, name: "Sketches", price: 60, image: placeholder("Sketches"), category: "art-materials" },
  { id: 403, name: "Color Pens", price: 55, image: placeholder("Color+Pens"), category: "art-materials" },
  { id: 404, name: "Glitters", price: 35, image: placeholder("Glitters"), category: "art-materials" },
  { id: 405, name: "Drawing Books", price: 70, image: placeholder("Drawing+Books"), category: "art-materials" },
  { id: 406, name: "Color Books", price: 65, image: placeholder("Color+Books"), category: "art-materials" },
];
