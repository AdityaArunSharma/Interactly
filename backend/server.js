const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
require('dotenv').config();
const mysql = require('mysql');


// Create a MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.userDB,
    password: process.env.passwordDB,
    database: process.env.dbName
  });
  
  // Connect to the MySQL database
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err);
      return;
    }
    console.log('Connected to MySQL database!');
  });




// Endpoint to get a contact by contact_id
app.post('/getContact', async (req, res) => {
  const contactId = req.body.contact_id;
  const data_store = req.body.data_store;
  const apiKey = process.env.API_KEY;
  const BASE_URL = process.env.BASE_URL;

  if(!contactId || !data_store){
    res.status(500).json({error: "Wrong Arguments"})
    return;
  }
    
  if(data_store == "CRM"){

    try {
        const response = await axios.get(BASE_URL+`/api/contacts/${contactId}`, {
          headers: {
            Authorization: `Token token=${apiKey}`,
            // Content-Type: `application/json`
          },
        });
    
        const contact = response.data;
    
        if (contact) {
          res.json(contact);
        } else {
          res.status(404).json({ error: 'Contact not found' });
        }
      } catch (error) {
        // console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }

    }
  else if(data_store=="DATABASE"){

        const { contact_id } = req.body;

        // Fetch the contact from the database
        const query = 'SELECT * FROM contacts WHERE contact_id = ?';
        connection.query(query, [contact_id], (error, results, fields) => {
            if (error) {
                console.error('Error fetching contact:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

        if(results.length === 0) {
            res.status(404).json({ error: 'Contact not found' });
            return;
        }

        const contact = results[0];
        res.json(contact);
  });

  }
  else{
    res.status(500).json({error: "Wrong data_store value"})
  }



  
});

app.post('/createContact', async (req, res) => {
    const {first_name,last_name,email,mobile_number,data_store} = req.body;
    const apiKey = process.env.API_KEY;
    const BASE_URL = process.env.BASE_URL;

    if(!data_store || !first_name || !last_name || !email || !mobile_number){
        res.status(500).json({error: "Wrong Arguments"})
        return;
      }
        
    

    if(data_store=="CRM"){
        const newContact = {"contact":
            {
                "first_name":first_name,
                "last_name":last_name,
                "mobile_number":mobile_number,
                "email": email
            }
        }
        try {
            const response = await axios.post(BASE_URL+`/api/contacts`,newContact, {
                headers: {
                    Authorization: `Token token=${apiKey}`,
                    // Content-Type: `application/json`
                },
            });
  
            const contact = response.data;
  
            if (contact) {
                res.json(contact);
            } else {
                res.status(404).json({ error: 'Error creating contact' });
            }
        } catch (error) {
        // console.error(error);
        res.status(500).json({ error: 'Internal server error' });
        }
    }
    else if(data_store=="DATABASE"){

        const { first_name, last_name, email, mobile_number } = req.body;

        // Insert the contact into the database
        const insertQuery = 'INSERT INTO contacts (first_name, last_name, email, mobile_number) VALUES (?, ?, ?, ?)';
        connection.query(insertQuery, [first_name, last_name, email, mobile_number], (error, results, fields) => {
            if (error) {
                console.error('Error inserting contact:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            // Fetch the inserted contact from the database
            const selectQuery = 'SELECT * FROM contacts WHERE contact_id = ?';
            connection.query(selectQuery, [results.insertId], (error, results, fields) => {
                if (error) {
                    console.error('Error fetching contact:', error);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                const contact = results[0];
                res.json(contact);
            });
        });

    }
    else{
        res.status(500).json({error: "Wrong data_store value"})
    }

});



app.post('/updateContact', async (req, res) => {
    const {contact_id,new_email,new_mobile_number,data_store} = req.body;
    const apiKey = process.env.API_KEY;
    const BASE_URL = process.env.BASE_URL;

    if(!contact_id || !data_store || !new_email || !new_mobile_number){
        res.status(500).json({error: "Wrong Arguments"})
        return;
      }
        
    
    if(data_store=="CRM"){

        const newContact = {"contact":
            {
                "mobile_number":new_mobile_number,
                "email": new_email
            }
        }
    
        try {
                const response = await axios.put(BASE_URL+`/api/contacts/${contact_id}`,newContact, {
                headers: {
                            Authorization: `Token token=${apiKey}`,
                            // Content-Type: `application/json`
                        },
                });
  
                const contact = response.data;
  
                if (contact) {
                    res.json(contact);
                } else {
                    res.status(404).json({ error: 'Error creating contact' });
                }
        }catch (error) {
            // console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }

    }
    else if(data_store=="DATABASE"){

        const { contact_id, new_mobile_number, new_email } = req.body;
        if(!contact_id|| !data_store){
            res.status(500).json({error: "Wrong Arguments"})
            return;
          }
            
        // Update the contact in the database
        const query = 'UPDATE contacts SET mobile_number = ?, email = ? WHERE contact_id = ?';
        connection.query(query, [new_mobile_number, new_email, contact_id], (error, results, fields) => {
            if (error) {
                console.error('Error updating contact:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (results.affectedRows === 0) {
                res.status(404).json({ error: 'Contact not found' });
                return;
            }

            // Fetch the updated contact from the database
            const selectQuery = 'SELECT * FROM contacts WHERE contact_id = ?';
            connection.query(selectQuery, [contact_id], (error, results, fields) => {
            if (error) {
                console.error('Error fetching contact:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            const contact = results[0];
            res.json(contact);
    });
  });

    }
    else{
        res.status(500).json({error: "Wrong data_store value"})
    }

    
  });




  app.post('/deleteContact', async (req, res) => {
    const {contact_id,data_store} = req.body;
    const apiKey = process.env.API_KEY;
    const BASE_URL = process.env.BASE_URL;
    

    if(data_store=="CRM"){

        try {
            const response = await axios.delete(BASE_URL+`/api/contacts/${contact_id}`, {
              headers: {
                Authorization: `Token token=${apiKey}`,
                // Content-Type: `application/json`
              },
            });
        
            const contact = response.data;
        
            if (contact) {
              res.json(contact);
            } else {
              res.status(404).json({ error: 'Error creating contact' });
            }
          } catch (error) {
            // console.error(error);
            res.status(500).json({ error: 'Internal server error' });
          }

    }
    else if(data_store=="DATABASE"){

        const { contact_id } = req.body;

        // Delete the contact from the database
        const query = 'DELETE FROM contacts WHERE contact_id = ?';
        connection.query(query, [contact_id], (error, results, fields) => {
            if (error) {
                console.error('Error deleting contact:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            const isDeleted = results.affectedRows > 0;
            res.json({ success: isDeleted });
        });

    }
    else{
        res.status(500).json({error: "Wrong data_store value"})
    }

    
    
  
    
  });


// Start the server
app.listen(3001, () => {
  console.log('Server started on port 3000');
});
