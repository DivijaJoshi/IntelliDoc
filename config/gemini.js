const {GoogleGenAI,createUserContent,createPartFromUri}=require('@google/genai')
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



const geminiCall=async(task,inputs,existingTasks)=>{


    //format complete prompt with examples, input and output format
    
    let fewShotprompt=''
    task.examples.forEach(example=>
        {
        fewShotprompt+=`Example input is: ${example.input} and \n
        Example output is: ${example.output} Follow the above formatting.\n\n\n`
    })

    let finalPrompt=`${fewShotprompt}\n ${task.prompt}`


    if(existingTasks){
         finalPrompt+=`\n\n\n You are given a list of existing tasks:
         ${existingTasks}\n\n If user's request is similar to any exisitng task above by checking it's intent, 
         inform the user that the task already exists, mention the task name and ID and say to use it instead.
         \n\n
         
         else
         if user request is not similar to any existing task above,process the request normally.\n
          Ensure that the request lies in documnet processing/text processing/image processing domain only.\n
           else tell the user appropriate message. `
    }
    

    //create contents object (The Gemini API represents prompts as structured Content objects
        //  containing one or more Part objects, each representing text or media.)

        let contents

        if(inputs.type==='text'){
            contents=`${inputs.textContent} \n ${finalPrompt}`

            
        }

        else if(inputs.type==='file' ||inputs.type==='image'){


      contents= createUserContent([
      createPartFromUri(inputs.Uri, inputs.mimeType),
      finalPrompt,
    ])

        }


        //generate response in chunks
    return await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config:{
            systemInstruction: task.systemPrompt
        }
  });


}






module.exports={ai,
    geminiCall
}