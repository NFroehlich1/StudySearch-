// Quick test of the chat analyzer logic
const testMessages = [
  {
    role: 'assistant',
    content: "Hello! I'm your KIT Mechatronics Course Guide. How can I help you?",
    timestamp: "19:19:00"
  },
  {
    role: 'user',
    content: "I want to take Machine Learning in WS 2024",
    timestamp: "19:19:15"
  },
  {
    role: 'assistant',
    content: "Great! I've added Machine Learning to WS 2024 for you.",
    timestamp: "19:19:30"
  },
  {
    role: 'user',  
    content: "Also add Control Systems to SS 2025",
    timestamp: "19:19:45"
  },
  {
    role: 'assistant',
    content: "I've added Control Systems to SS 2025. Both courses are now in your semester plan!",
    timestamp: "19:20:00"
  }
];

console.log("📝 Test Messages:");
console.log("================\n");

testMessages.forEach((msg, i) => {
  console.log(`${i+1}. [${msg.role.toUpperCase()}]: ${msg.content}`);
});

console.log("\n🔍 What Should Be Extracted:");
console.log("============================");
console.log("✅ Machine Learning → WS 2024");
console.log("✅ Control Systems → SS 2025");

console.log("\n📊 Expected Result:");
console.log("===================");
console.log("2 courses found");
console.log("Courses auto-assigned to correct semesters");
console.log("Toast notification: '✅ Added 2 booked courses to your planner!'");
