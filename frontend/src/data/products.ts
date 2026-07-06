export interface ProductItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

const productPhoto = (name: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}/200/200`;

export const notebookProducts: ProductItem[] = [
  { id: 101, name: "Single Ruled Book", price: 45, image: productPhoto("Single Ruled Book"), category: "notebooks" },
  { id: 102, name: "Double Ruled Book", price: 50, image: productPhoto("Double Ruled Book"), category: "notebooks" },
  { id: 103, name: "Plain Pages Book", price: 40, image: productPhoto("Plain Pages Book"), category: "notebooks" },
  { id: 104, name: "Long Book", price: 60, image: productPhoto("Long Book"), category: "notebooks" },
  { id: 105, name: "Short Book", price: 35, image: productPhoto("Short Book"), category: "notebooks" },
  { id: 106, name: "100 Pages Book", price: 55, image: productPhoto("100 Pages Book"), category: "notebooks" },
  { id: 107, name: "200 Pages Book", price: 75, image: productPhoto("200 Pages Book"), category: "notebooks" },
  { id: 108, name: "500 Pages Book", price: 120, image: productPhoto("500 Pages Book"), category: "notebooks" },
  { id: 109, name: "Color Charts", price: 30, image: productPhoto("Color Charts"), category: "notebooks" },
  { id: 110, name: "Plain White Charts", price: 25, image: productPhoto("Plain White Charts"), category: "notebooks" },
  { id: 111, name: "A4 Sheet Pack", price: 20, image: productPhoto("A4 Sheet Pack"), category: "notebooks" },
  { id: 112, name: "A3 Sheet Pack", price: 35, image: productPhoto("A3 Sheet Pack"), category: "notebooks" },
  { id: 113, name: "A1 Sheet Pack", price: 50, image: productPhoto("A1 Sheet Pack"), category: "notebooks" },
];

export const accessoriesProducts: ProductItem[] = [
  { id: 201, name: "Marker", price: 30, image: productPhoto("Marker"), category: "accessories" },
  { id: 202, name: "Ball Pen", price: 15, image: productPhoto("Ball Pen"), category: "accessories" },
  { id: 203, name: "Gel Pen", price: 25, image: productPhoto("Gel Pen"), category: "accessories" },
  { id: 204, name: "Pencil", price: 10, image: productPhoto("Pencil"), category: "accessories" },
  { id: 205, name: "Eraser", price: 8, image: productPhoto("Eraser"), category: "accessories" },
  { id: 206, name: "Sharpener", price: 12, image: productPhoto("Sharpener"), category: "accessories" },
  { id: 207, name: "Scale", price: 18, image: productPhoto("Scale"), category: "accessories" },
  { id: 208, name: "Geometry Box", price: 85, image: productPhoto("Geometry Box"), category: "accessories" },
];

export const booksProducts: ProductItem[] = [
  { id: 301, name: "Novels", price: 250, image: productPhoto("Novels"), category: "books" },
  { id: 302, name: "Fictional Books", price: 220, image: productPhoto("Fictional Books"), category: "books" },
  { id: 303, name: "Anime Books", price: 300, image: productPhoto("Anime Books"), category: "books" },
  { id: 304, name: "Text Books", price: 350, image: productPhoto("Text Books"), category: "books" },
  { id: 305, name: "Science Books", price: 400, image: productPhoto("Science Books"), category: "books" },
  { id: 306, name: "Poetry Books", price: 180, image: productPhoto("Poetry Books"), category: "books" },
  { id: 307, name: "Diary", price: 120, image: productPhoto("Diary"), category: "books" },
  { id: 308, name: "Journals", price: 150, image: productPhoto("Journals"), category: "books" },
];

export const artMaterialsProducts: ProductItem[] = [
  { id: 401, name: "Crayons", price: 45, image: productPhoto("Crayons"), category: "art-materials" },
  { id: 402, name: "Sketches", price: 60, image: productPhoto("Sketches"), category: "art-materials" },
  { id: 403, name: "Color Pens", price: 55, image: productPhoto("Color Pens"), category: "art-materials" },
  { id: 404, name: "Glitters", price: 35, image: productPhoto("Glitters"), category: "art-materials" },
  { id: 405, name: "Drawing Books", price: 70, image: productPhoto("Drawing Books"), category: "art-materials" },
  { id: 406, name: "Color Books", price: 65, image: productPhoto("Color Books"), category: "art-materials" },
];
