# Distributed AI Document Processing System

---

## How it Started? (General Idea about the project)

I didn't come across this topic for the project directly. I only wanted to integrate Gemini with api calls. So I choose Document processing as the main domain.

I realised that if multiple users sent the requests at the same time, it would lead to longer response times and degrade the performance.

So I setup RabbitMQ to process the requests in background.

Now number of requests in rabbitMQ queue might vary, more for a particular task and less for some. So instead of manually starting new Workers, I created a worker manager who tracks the queue size every 10 seconds and scales accordingly.

Then I faced a problem, I was getting the gemini response but how to show it to the user, as request response cycle would time-out by the time gemini processed the request. To solve this I Integrated Socket.io for real time communication.

---

## Architecture or Thought Process

### DB Schema

**Users:**

```
id
name
email
password
role
```

**Task:**

```
id
taskName
description
prompt
systemPrompt
examples
queueName
routingKey
```

![Architecture and Execution Flow](IntelliDocArchitectureDiagrams.png)

---

## API (10)

### Auth Endpoints

1. Signup (user/admin)
2. Login (user/admin)

### Task Endpoints

3. Get all Tasks (user/admin)

### User Action Endpoints

4. Run task (user)
5. Update user profile (user)

### Admin Action Endpoints

6. Get all Users (admin)
7. Delete users (admin)
8. Create new task (admin)
9. Delete task by id (admin)
10. Update Task (admin)

---

## Main Design Process

1. Admin can create new tasks and add to db (with details like prompt, system prompt, examples)
2. Users can either choose out of existing tasks or send a custom task
3. For existing tasks user sends textContent (if processing text) or filePath (for pdf, image, docx)
4. User should have minimal interaction and only provide essential inputs so mimetype field and type of data is auto set based on file path extension. (mimetype is later needed for gemini api call)
5. Multiple users running task simaltaneously shouldn't block each other, Workers should be scalable.
6. Each user should get their gemini call result in a socket.io room (with unique roomId) (as request/response cycle might timeout, socket.io room allows persistent connection till response is fetched)
7. Validating roomId or already processed task if incorrect roomId is sent, onError socket event should be triggered saying invalid roomId or request already processed.

---

## Challenges I Faced

### 1) Setting up RabbitMQ

I faced an error called property doesnt exist for createChannel method. So I went through stack overflow solutions and official documentation, I got a suggestion of downgrading amqp version to 10.5 but it still didnt work. I could't find other suggestions to solve it.

So used ai for this, it told me to install amqp with @latest and it somehow got fixed.

---

### 2) Managing Request Body Fields with Multiple Data Formats

Second challenge I faced was thinking about all the fields in request body and how it will work together with multiple data formats and gemini.

User can send the inputs as textContent (if processing text) or form-data files (for pdf, image, docx)

**Validations:**

- Only one of textContent or file is allowed (as form-data)
- Atleast one of textContent or filePath is needed

```js
const allowedFileTypesObject = {
    '.pdf': 'file',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.docx': 'file'
}

const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}
```

`allowedFileTypesObject` and `mimeTypes` objects are used for validation and setting mimeTypes.

```js
//extract extension of file to check filetype
const extension = path.extname(req.file.originalname)

type = allowedFileTypesObject[extension] //set type as file or image
mimeType = mimeTypes[extension]          //set mimetype for a type
```

For managing files I have used gemini file api for handling different file formats. As Gemini API accepts file size greater than 100mb, it's more efficient.

```js
//upload files to gemini
const myfile = await ai.files.upload({
    file: filePath,
    config: {mimeType},
});
```

Then instead of manually sending files (raw data), send the file uri.

```js
//set input argument to be passed for gemini call function
input = {
    type,
    Uri: myfile.uri,           //get uri of file and pass here
    mimeType: myfile.mimeType  //mimetype of file
}
```

`uri` and `mimeType` are needed for the `createUserContent` method of gemini.

```js
createUserContent([
    createPartFromUri(myfile.uri, myfile.mimeType),
    "Describe this audio clip",
]),
```

The Gemini API represents prompts as structured Content objects containing one or more Part objects, each representing text or media.

---

### 3) Sending Gemini Response to User

Third challenge I faced was when I got the gemini response, I couldn't figure out how to send it to user in backend as api call follows a request response cycle. Till the time gemini response is received api call times out, so to solve this problem, I used websockets.

---

### 4) WebSocket Logic — Message Lost Before User Joins

Another issue I faced was in logic of websockets, what I was doing was:

user runs a task → gets roomId → joins room to get gemini response

But it wasn't happening parallely. By the time user joined, message was already lost. So to fix this I made a seperate function and triggered a joinroom event after user joins the room. So gemini api call is made only after user joins the room and message isn't lost.

---

### How to Test Run Task API in Postman

**Step 1)** Run `rabbitmq-server start` to start RabbitMQ

**Step 2)** Run `npm start` to start the server

**Step 3)** User should send a POST request to `/api/user/ai-task-run/:id`
or `/api/user/ai-task-run/others` for a new task that doesn't exist in the DB
(with valid inputs to get a roomId)

**Step 4)** User connects to socket.io request on postman on url `http://localhost:3000`

In events section user should listen to 3 events:

1. `taskChunk`
2. `taskError`
3. `Done`

And connect to server.

Then inside message section, user should put the roomId, in events box send `joinRoom` event and click on send button.

```js
//listener for when user joins a room
socket.on('joinRoom', async (roomId) => {
    socket.join(roomId)
    console.log('Joined task room-', roomId)
    //start task only after user joins room
    await startTask(roomId, socket)
})
```

---

### 5) Managing Workers

Last problem was managing the workers. Instead of managing workers manually, I created a workerManger. Based on specific threshold of min and max worker, it scales worker by counting number of messages in the queue for a given task.

---

## Changes / Fixes I Made

1. Fixed Task details global in userController
2. Fixed CheckQueue return value logic
3. Sanitizing filePath, integrated multer to get files directly instead of file paths
4. Added config files to repo
5. Removed duplicate packages
6. Added .eslintrc file (not fixed the code formatting and spaces yet)
7. Added nodemon as dev dependency
8. Removed Socket.io unused onError event listener in server.js
9. Updated UpdateProfile with email already exists error
10. Removed prefetch from producer side, only kept in consumer
11. Implemented customTask logic if user doesnt want to run an existing task.
