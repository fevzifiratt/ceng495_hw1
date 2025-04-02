## Fevzi Fırat Tatar / 2522001

## CENG495-HW1:BUILDING AN E-COMMERCE PLATFORM

For this assignment, I developed a simple E-Commerce Platform. I have never used ``Vercel`` before. Therefore, by watching the tutorials, I used the basic project template: ``Next.js Boilerplate``.

Next.js is the ideal framework for my project because it combines ``TypeScript`` support, server-side rendering, built-in API routes which simplifies the backend development, smooth ``MongoDB`` integration, and authentication capabilities in a single, unified, easily implemented, full-stack development environment by using ``NextAuth`` library.

## BACKEND

First, I started with creating a database in ``MongoDB``. After I successfully created it, I created a project on ``Vercel``, and cloned it to my local. Then, I started to develop the backend part of the application.

I created two tables: ``users`` and ``items``. I added the necessary fields and created the database by using ``Insomnia``. For both tables, I added an extra record ``ReviewCount`` to calculate the average rating for both users and items easier. For ``reviews``, I did not add an extra table since I tried to use the database as few collections as possible. Instead, I put the original records of the reviews to both relevant user and item. In ``users``, a review contains the relevant ``itemId``, ``itemName``, ``rating``, and ``comment``. In ``items``, it contains the relevant ``username``, ``rating``, and ``comment``. 

Then, I created the endpoints without authentication. Here are the endpoints:

GET ``api/users``: : Get all users.

POST ``api/users``: Create a new user.

GET ``api/users/[username]``: Retrieve a specific user by username.

DELETE ``api/users/[username]``: Remove a specific user by username.

GET ``api/items``: Get all items.

POST ``api/items``: Create a new item.

GET ``api/items/[id]``: Retrieve a specific item by id, created by ``MongoDB``.

DELETE ``api/items/[id]``: Remove a specific user by id, created by ``MongoDB``.

GET ``api/reviews``: Retrieve reviews by filtering with respect to the user, or the item.

POST ``api/reviews``: Create a new review which is added to both item and user.

``api/auth/[..nextauth]``: Helper for the NextAuth. Handles GET and POST requests.

Then, I added the authentication logic by using ``NextAuth``.

## FRONTEND

The home page consist of the items listed. A non-authenticated user can see, and filter all the items. Moreover, he/she can see the details of the item with the reviews. The images are not loaded. Therefore, I put a hyperlink, and if the photo is not loaded, I put a default icon ``file.svg``. However, to see the other pages, the user needs to log in.

The login page is same for all regular and admin users. After you log in, in the item details page, you can review that item. As the regulation, you can make multiple reviews where the new one overwrites the old one. You need to rate the item, but you can leave the comment part empty.

The navigation bar at the top stays at all pages. When you want to go to the main pages, you can use that bar. However, when you logged in, or your role is different, some additional buttons arrive. 

If you are a regular user, you get a ``Profile`` button, which directs you to the profile page. The profile page consist of the user's details, with all the reviews he/she made as well.

If you are an admin, you get an additional ``Admin`` button which directs you to the admin's management page. I created a main admin page to more proper navigation. From that page, the admin can move to two pages: All the users list, and all the items list. In these lists, the admin can see the details of the users and items. Moreover, the admin can add or remove the users and items as well. If the admin is adding a user, he/she can choose if the new user is also going to be an admin or not.

The URL for Vercel Deployment: https://ceng495hw1.vercel.app/

