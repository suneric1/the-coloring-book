# Welcome to The Coloring Book

The Coloring Book is a website where you can pick sketch templates and color them, just like the Secret Gardon coloring book. When coloring, you’ll have a color palette with 12 colors. To help you get more creative, there is a `Blend Mode` by which you can mix colors together. I also made it mobile friendly with a responsive design.

A nice feature to mention is that you can see how it’s like when everyone’s painting mixed together. By this, you’ll have a sense of the trend of the use of color. 

### [Link to live website](http://thecoloringbook.herokuapp.com/)

## How it was done

I built the website with Node.js. Each sketch template is an SVG file, and the color data is stored in a sqlite database. When replying the WORKS page, the server will look into the database and insert a corresponding SVG object for each row. However, the SVG object itself doesn't contain any color data, so there is an `onload` function to fetch color data from a route.

In the coloring page, when you submit, it will generate a FormData object with all the color information and post it to the server. The server will update the database with a new row, and also update the row of mixed color data. It basically finds all the color for each path of the same SVG, and averages them out.

A problem of dealing with the database in this project is that I originally wanted to create one table for each type of SVG, but it would be a mess since all of them have different amount of paths. So I ended up creating one table with a large number of columns for all the data, though there will be a bunch of empty cells in this case.

### The Sketch
![sketch](https://raw.githubusercontent.com/suneric1/the-coloring-book/master/public/images/thecoloringbook_sketch.jpg)