import express from "express"; // module js syntax

const app = express();

const port = process.env.PORT || 8001;

app.listen(port, () => {
  console.log(`server running on ${port}`);
});

// app.get('/',(req,res) => {
//     res.send('Home page')
// })

app.get("/api/names", (req, res) => {
  const data = [
    {
      id: 1,
      name: "Sourabh",
      content: "This is me",
    },
    {
      id: 2,
      name: "Ravi",
      content: "He is my frnd",
    },
    {
      id: 3,
      name: "Ankit",
      content: "He is my roomate",
    },
  ];

  res.send(data)
});
