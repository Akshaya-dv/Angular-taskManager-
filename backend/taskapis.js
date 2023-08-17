const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(express.json());
app.use(cors());


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'taskdatabase',
    password: '1234',
    port: 5432,
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS usertable (
    uid SERIAL PRIMARY KEY,
    uname VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    pass VARCHAR(50) NOT NULL
  );
`;

const createtaskTable = `
CREATE TABLE IF NOT EXISTS tasktable (
    tid SERIAL PRIMARY KEY,
    tname VARCHAR(40) NOT NULL,
    priorities VARCHAR(10) NOT NULL,
    sdate  DATE NOT NULL,
    edate  DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    uid INT REFERENCES usertable(uid)
  );`;



// Function to create the 'bank_info' table if it doesn't exist
pool.connect()
    .then(client => {
        return client.query(createtaskTable)
            .then(() => client.release())
            .catch(error => {
                client.release();
                console.error('Error creating table:', error);
            });
    })
    .catch(error => console.error('Error connecting to database:', error));



//insert in login data
app.post('/taskmanager/sigin', async (req, res) => {
    const formData = req.body;
    //console.log("asdfghjkl",typeof formData,formData);
    const datas = await getuserdata("");
    if (datas[0] == 200) {
        if (!datas[1].some(data => data.email == formData.email)) {
            const insertQuery = `INSERT INTO public.usertable( uname, email, pass)
        VALUES ( '${formData.uname}','${formData.email}' , '${formData.pass}');`

            // console.log(insertQuery)
            pool.query(insertQuery)
                .then(() => {
                    res.status(200).send(JSON.stringify('Successfully Registered'));
                })
                .catch(error => {
                    res.status(500).end(JSON.stringify('Error some thing went wrong ', error));
                })
        }
        else {
            res.status(200).send(JSON.stringify('This email is already registered '));
        }
    }
    else {
        res.status(500).end('Error some thing went wrong ');
    }
});

// get login data
app.get('/taskmanager/signin', async (req, res) => {
    const email = req.query.email;
    const pass = req.query.pass;
    const where = ` where email='${email}' `
    const data = await getuserdata(where);
    const status = JSON.stringify(data[1])
    res.status(data[0]).end(status)

});

//get task data
app.get('/taskmanager/task', async (req, res) => {
    const uid = req.query.uid;
    const tid=req.query.tid
    let where=`where uid='${uid}'`
    if(tid){
        where=` where tid='${tid}' `
    }
    const data = await gettaskdata(where)
    const task = JSON.stringify(data[1])
    res.status(data[0]).end(task)
});



//post task data
app.post('/taskmanager/task', async (req, res) => {
    const uid = req.query.uid;
    const taskData = req.body;

    const insertQuery = `INSERT INTO public.tasktable(tname, priorities, sdate, edate, status, uid)
        VALUES ( '${taskData.tname}', '${taskData.priorities}', '${taskData.sdate}', '${taskData.edate}', '${taskData.status}', ${uid});`
    // console.log(insertQuery)
    pool.query(insertQuery)
        .then(() => {
            res.status(200).end(JSON.stringify(' Successfully inserted new record '));
        })
        .catch(error => {
            res.status(500).end(JSON.stringify('Error some thing went wrong ', error));
        })

});

app.put('/taskmanager/task', (req, res) => {
    const tid = req.query.tid;
    const taskData = req.body;
    const update = `UPDATE public.tasktable
	SET  tname='${taskData.tname}', priorities='${taskData.priorities}', sdate='${taskData.sdate}', edate='${taskData.edate}', status='${taskData.status}'
	WHERE tid=${tid};`
    //console.log(update)
    pool.query(update)
        .then(() => {
            res.status(200).send(JSON.stringify('Success'));
        })
        .catch(error => {
            res.status(500).end(JSON.stringify('Error some thing went wrong ', error));
        })
});


app.delete('/taskmanager/task', (req, res) => {
    const tid = req.query.tid;
    const deleteQ = `
    DELETE FROM public.tasktable
	WHERE tid=${tid};`
    //console.log(update)
    pool.query(deleteQ)
        .then(() => {
            res.status(200).send(JSON.stringify('Successfully Deleted'));
        })
        .catch(error => {
            res.status(500).end(JSON.stringify('Error some thing went wrong ', error));
        })
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




function getuserdata(where) {
    const select = ` SELECT * FROM public.usertable ${where} ;`
    // console.log(select);
    return new Promise((resolve, reject) => {
        pool.query(select)
            .then(result => {
                const data = result.rows;
                console.log('Fetched data:');
                //  console.log([200, data]);
                resolve([200, data]);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                reject([500, 'Error fetching data']);
            });
    });
}


function gettaskdata(where) {
    const select = ` SELECT * FROM public.tasktable ${where} ;`
    // console.log(select);
    return new Promise((resolve, reject) => {
        pool.query(select)
            .then(result => {
                const data = result.rows;
               // console.log('Fetched data:', data);
                resolve([200, data]);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                reject([500, 'Error fetching data']);
            });
    });
}




