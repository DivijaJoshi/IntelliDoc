const {GoogleGenAI,createUserContent,createPartFromUri}=require('@google/genai')
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



const geminiCall=async(task,inputs)=>{


    //format complete prompt with examples, input and output format
    
    let fewShotprompt=''
    task.examples.forEach(example=>
        {
        fewShotprompt=`Example input is: ${example.input} and \n
        Example output is: ${example.output} Follow the above formatting.\n\n\n`
    })

    const finalPrompt=`${fewShotprompt}\n ${task.prompt}`
    

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