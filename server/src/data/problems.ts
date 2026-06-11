export const STABLE_IDS = [
  "698738da85f5b306c4c3c861", // 01. Basic AND Gate
  "698738da85f5b306c4c3c862", // 02. Basic OR Gate
  "698738da85f5b306c4c3c863", // 03. NOT Gate
  "698738da85f5b306c4c3c864", // 04. XOR Gate
  "698738da85f5b306c4c3c865", // 05. NAND Gate
  "698738da85f5b306c4c3c866", // 06. Half Adder
  "698738da85f5b306c4c3c867", // 07. Full Adder
  "698738da85f5b306c4c3c868", // 08. 2:1 Multiplexer
  "698738da85f5b306c4c3c869", // 09. 4-bit Comparator
  "698738da85f5b306c4c3c86a", // 10. 2-to-4 Decoder
  "698738da85f5b306c4c3c86b", // 11. 4-bit Ripple Carry Adder
  "698738da85f5b306c4c3c86c", // 12. BCD to 7-Segment
  "698738da85f5b306c4c3c86d", // 13. D Flip-Flop
  "698738da85f5b306c4c3c86e", // 14. T Flip-Flop
  "698738da85f5b306c4c3c86f", // 15. 4-bit Up Counter
  "698738da85f5b306c4c3c870", // 16. Clock Divider by 2
  "698e38d7be414817c8a85cd1", // 17. Left Shift Register
  "698738da85f5b306c4c3c872", // 18. Sequence Detector (101)
  "698e38d7be414817c8a85cd3", // 19. Traffic Light Controller
  "698738da85f5b306c4c3c874", // 20. Simple ALU
];

// Helper to save space on simple gates
const gateTB = (mod: string, expr: string) => `
  module test;
    reg a, b; wire y;
    ${mod} uut(a, b, y);
    initial begin
      a=0; b=0; #10; if(y !== (${expr})) $display("❌ 0,0 Failed. Expected %b, Got %b", (${expr}), y); else $display("✅ 0,0 Passed");
      a=0; b=1; #10; if(y !== (${expr})) $display("❌ 0,1 Failed. Expected %b, Got %b", (${expr}), y); else $display("✅ 0,1 Passed");
      a=1; b=0; #10; if(y !== (${expr})) $display("❌ 1,0 Failed. Expected %b, Got %b", (${expr}), y); else $display("✅ 1,0 Passed");
      a=1; b=1; #10; if(y !== (${expr})) $display("❌ 1,1 Failed. Expected %b, Got %b", (${expr}), y); else $display("✅ 1,1 Passed");
      $finish;
    end
  endmodule
`;

export const hardcodedProblems = [
  // =========================================
  // LEVEL 1: BASICS (1-5)
  // =========================================
  {
    title: "01. Basic AND Gate",
    difficulty: "Easy",
    category: "Gates",
    description: "Implement a 2-input AND gate.\nOutput should be 1 only if both inputs are 1.",
    templateCode: "module and_gate(input a, b, output y);\n  // Write code here\nendmodule",
    testbench: gateTB("and_gate", "a & b")
  },
  {
    title: "02. Basic OR Gate",
    difficulty: "Easy",
    category: "Gates",
    description: "Implement a 2-input OR gate.\nOutput should be 1 if at least one input is 1.",
    templateCode: "module or_gate(input a, b, output y);\n  // Write code here\nendmodule",
    testbench: gateTB("or_gate", "a | b")
  },
  {
    title: "03. NOT Gate",
    difficulty: "Easy",
    category: "Gates",
    description: "Implement a NOT gate (Inverter).",
    templateCode: "module not_gate(input a, output y);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg a; wire y;
        not_gate uut(a, y);
        initial begin
          a=0; #10; if(y!==1) $display("❌ Input 0 Failed"); else $display("✅ Input 0 Passed");
          a=1; #10; if(y!==0) $display("❌ Input 1 Failed"); else $display("✅ Input 1 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "04. XOR Gate",
    difficulty: "Easy",
    category: "Gates",
    description: "Implement an Exclusive-OR gate.\nOutput is 1 if inputs are different.",
    templateCode: "module xor_gate(input a, b, output y);\n  // Write code here\nendmodule",
    testbench: gateTB("xor_gate", "a ^ b")
  },
  {
    title: "05. NAND Gate",
    difficulty: "Easy",
    category: "Gates",
    description: "Implement a NAND gate (NOT-AND).",
    templateCode: "module nand_gate(input a, b, output y);\n  // Write code here\nendmodule",
    testbench: gateTB("nand_gate", "~(a & b)")
  },

  // =========================================
  // LEVEL 2: COMBINATIONAL (6-12)
  // =========================================
  {
    title: "06. Half Adder",
    difficulty: "Easy",
    category: "Combinational",
    description: "Design a Half Adder. It adds two bits and produces a Sum and Carry.",
    templateCode: "module half_adder(input a, b, output sum, carry);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg a,b; wire s,c;
        half_adder uut(a,b,s,c);
        initial begin
          {a,b}=0; #10; if({c,s}!==0) $display("❌ 0+0 Failed"); else $display("✅ 0+0 Passed");
          {a,b}=1; #10; if({c,s}!==1) $display("❌ 0+1 Failed"); else $display("✅ 0+1 Passed");
          {a,b}=2; #10; if({c,s}!==1) $display("❌ 1+0 Failed"); else $display("✅ 1+0 Passed");
          {a,b}=3; #10; if({c,s}!==2) $display("❌ 1+1 Failed"); else $display("✅ 1+1 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "07. Full Adder",
    difficulty: "Medium",
    category: "Combinational",
    description: "Design a Full Adder with Carry-In.",
    templateCode: "module full_adder(input a, b, cin, output sum, cout);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg a,b,cin; wire sum,cout;
        full_adder uut(a,b,cin,sum,cout);
        initial begin
          {a,b,cin}=0; #10; if({cout,sum}!==0) $display("❌ 0+0+0 Failed"); else $display("✅ 0+0+0 Passed");
          {a,b,cin}=3; #10; if({cout,sum}!==2) $display("❌ 0+1+1 Failed"); else $display("✅ 0+1+1 Passed");
          {a,b,cin}=7; #10; if({cout,sum}!==3) $display("❌ 1+1+1 Failed"); else $display("✅ 1+1+1 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "08. 2:1 Multiplexer",
    difficulty: "Easy",
    category: "Combinational",
    description: "Select between two inputs based on a select line 's'.\nIf s=0, y=i0. If s=1, y=i1.",
    templateCode: "module mux2to1(input i0, i1, s, output y);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg i0,i1,s; wire y;
        mux2to1 uut(i0,i1,s,y);
        initial begin
          i0=1; i1=0; s=0; #10; if(y!==1) $display("❌ Select 0 Failed"); else $display("✅ Select 0 Passed");
          i0=1; i1=0; s=1; #10; if(y!==0) $display("❌ Select 1 Failed"); else $display("✅ Select 1 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "09. 4-bit Comparator",
    difficulty: "Medium",
    category: "Combinational",
    description: "Compare two 4-bit numbers (a and b).\nOutputs: eq (Equal), gt (Greater Than), lt (Less Than).",
    templateCode: "module comparator(input [3:0] a, b, output eq, gt, lt);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg [3:0] a,b; wire eq,gt,lt;
        comparator uut(a,b,eq,gt,lt);
        initial begin
          a=5; b=5; #10; if(!eq) $display("❌ 5==5 Failed"); else $display("✅ 5==5 Passed");
          a=8; b=5; #10; if(!gt) $display("❌ 8>5 Failed"); else $display("✅ 8>5 Passed");
          a=2; b=5; #10; if(!lt) $display("❌ 2<5 Failed"); else $display("✅ 2<5 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "10. 2-to-4 Decoder",
    difficulty: "Medium",
    category: "Combinational",
    description: "Active High Decoder. Input 'in' (2 bits) selects one of 4 outputs 'y'.",
    templateCode: "module decoder(input [1:0] in, output [3:0] y);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg [1:0] in; wire [3:0] y;
        decoder uut(in,y);
        initial begin
          in=0; #10; if(y!==1) $display("❌ 00 -> 0001 Failed"); else $display("✅ 00 Passed");
          in=1; #10; if(y!==2) $display("❌ 01 -> 0010 Failed"); else $display("✅ 01 Passed");
          in=2; #10; if(y!==4) $display("❌ 10 -> 0100 Failed"); else $display("✅ 10 Passed");
          in=3; #10; if(y!==8) $display("❌ 11 -> 1000 Failed"); else $display("✅ 11 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "11. 4-bit Ripple Carry Adder",
    difficulty: "Medium",
    category: "Combinational",
    description: "Create a 4-bit adder using logic or + operator.",
    templateCode: "module rca_4bit(input [3:0] a, b, input cin, output [3:0] sum, output cout);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg [3:0] a,b; reg cin; wire [3:0] sum; wire cout;
        rca_4bit uut(a,b,cin,sum,cout);
        initial begin
          a=4; b=5; cin=0; #10; 
          if(sum!==9) $display("❌ 4+5 Failed"); else $display("✅ 4+5 Passed");
          a=15; b=1; cin=0; #10;
          if(cout!==1 || sum!==0) $display("❌ 15+1 Failed (Check Carry)"); else $display("✅ 15+1 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "12. BCD to 7-Segment",
    difficulty: "Medium",
    category: "Combinational",
    description: "Convert 4-bit BCD to 7-segment display (active low).",
    templateCode: "module seg7(input [3:0] bcd, output [6:0] seg);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg [3:0] bcd; wire [6:0] seg;
        seg7 uut(bcd, seg);
        initial begin
          bcd=0; #10; if(seg!==7'b1000000) $display("❌ 0 Failed"); else $display("✅ 0 Passed");
          bcd=1; #10; if(seg!==7'b1111001) $display("❌ 1 Failed"); else $display("✅ 1 Passed");
          bcd=8; #10; if(seg!==7'b0000000) $display("❌ 8 Failed"); else $display("✅ 8 Passed");
          $finish;
        end
      endmodule
    `
  },

  // =========================================
  // LEVEL 3: SEQUENTIAL (13-20)
  // =========================================
  {
    title: "13. D Flip-Flop",
    difficulty: "Medium",
    category: "Sequential",
    description: "Positive edge triggered D Flip-Flop.",
    templateCode: "module d_ff(input clk, d, output reg q);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,d; wire q;
        d_ff uut(clk,d,q);
        initial begin
          clk=0; d=0; #5 clk=1; #5; if(q!==0) $display("❌ Store 0 Failed"); else $display("✅ Store 0 Passed");
          clk=0; d=1; #5 clk=1; #5; if(q!==1) $display("❌ Store 1 Failed"); else $display("✅ Store 1 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "14. T Flip-Flop (Toggle)",
    difficulty: "Medium",
    category: "Sequential",
    description: "Toggle output q when T=1 on clock edge. If T=0, hold state.",
    templateCode: "module t_ff(input clk, t, rst, output reg q);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,t,rst; wire q;
        t_ff uut(clk,t,rst,q);
        initial begin
          // Reset first
          rst=1; clk=0; #5 clk=1; #5;
          
          // Test Toggle
          rst=0; t=1; clk=0; #5 clk=1; #5;
          if(q!==1) $display("❌ Toggle 0->1 Failed"); else $display("✅ Toggle 0->1 Passed");
          
          clk=0; #5 clk=1; #5;
          if(q!==0) $display("❌ Toggle 1->0 Failed"); else $display("✅ Toggle 1->0 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "15. 4-bit Up Counter",
    difficulty: "Medium",
    category: "Sequential",
    description: "Count up from 0 to 15. Asynchronous Reset.",
    templateCode: "module counter(input clk, rst, output reg [3:0] q);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,rst; wire [3:0] q;
        counter uut(clk,rst,q);
        initial begin
          rst=1; clk=0; #5 clk=1; #5; // Reset
          rst=0;
          repeat(5) begin clk=0; #5 clk=1; #5; end // Count 5 times
          if(q!==5) $display("❌ Count to 5 Failed, Got %d", q); else $display("✅ Count to 5 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "16. Clock Divider by 2",
    difficulty: "Medium",
    category: "Sequential",
    description: "Create a circuit that divides the clock frequency by 2.",
    templateCode: "module clk_div2(input clk, rst, output reg q);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,rst; wire q;
        clk_div2 uut(clk,rst,q);
        initial begin
          rst=1; clk=0; #5 clk=1; #5; 
          rst=0;
          clk=0; #5 clk=1; #5;
          if(q!==1) $display("❌ First Edge Failed"); else $display("✅ First Edge Passed");
          clk=0; #5 clk=1; #5;
          if(q!==0) $display("❌ Second Edge Failed"); else $display("✅ Second Edge Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "17. Left Shift Register",
    difficulty: "Medium",
    category: "Sequential",
    description: "4-bit Shift Left Register. Shift logic: {q[2:0], d}.",
    templateCode: "module lshift(input clk, rst, d, output reg [3:0] q);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,rst,d; wire [3:0] q;
        lshift uut(clk,rst,d,q);
        initial begin
          rst=1; clk=0; #5 clk=1; #5; // Reset (q=0000)
          rst=0; d=1;
          clk=0; #5 clk=1; #5; // Shift in 1 -> 0001
          if(q!==1) $display("❌ Shift 1 Failed"); else $display("✅ Shift 1 Passed");
          d=0;
          clk=0; #5 clk=1; #5; // Shift in 0 -> 0010 (2)
          if(q!==2) $display("❌ Shift 2 Failed"); else $display("✅ Shift 2 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "18. Sequence Detector (101)",
    difficulty: "Hard",
    category: "FSM",
    description: "Detect the pattern '101' (Overlapping allowed). Output 1 when pattern matches.",
    templateCode: "module seq101(input clk, rst, x, output reg z);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,rst,x; wire z;
        seq101 uut(clk,rst,x,z);
        initial begin
          rst=1; clk=0; #5 clk=1; #5;
          rst=0;
          
          // Sequence: 1 -> 0 -> 1 (Match!)
          x=1; clk=0; #5 clk=1; #5;
          x=0; clk=0; #5 clk=1; #5;
          x=1; clk=0; #5 clk=1; #5;
          
          if(z!==1) $display("❌ Pattern 101 Failed"); else $display("✅ Pattern 101 Passed");
          $finish;
        end
      endmodule
    `
  },
  {
    title: "19. Traffic Light Controller",
    difficulty: "Hard",
    category: "FSM",
    description: "Cycle: Red(10) -> Green(00) -> Yellow(01).",
    templateCode: "module traffic(input clk, rst, output reg [1:0] light);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg clk,rst; wire [1:0] l;
        traffic uut(clk,rst,l);
        initial begin
          rst=1; clk=0; #5 clk=1; #5; // Reset to Red (10)
          rst=0;
          if(l!==2) $display("❌ Reset Failed"); else $display("✅ Reset Passed");
          
          clk=0; #5 clk=1; #5; // Next -> Green (00)
          if(l!==0) $display("❌ Red->Green Failed"); else $display("✅ Red->Green Passed");
          
          clk=0; #5 clk=1; #5; // Next -> Yellow (01)
          if(l!==1) $display("❌ Green->Yellow Failed"); else $display("✅ Green->Yellow Passed");
          
          $finish;
        end
      endmodule
    `
  },
  {
    title: "20. Simple ALU",
    difficulty: "Hard",
    category: "Combinational",
    description: "4-bit ALU. Op: 00(+), 01(-), 10(&), 11(|).",
    templateCode: "module alu(input [3:0] a, b, input [1:0] op, output reg [3:0] y);\n  // Write code here\nendmodule",
    testbench: `
      module test;
        reg [3:0] a,b; reg [1:0] op; wire [3:0] y;
        alu uut(a,b,op,y);
        initial begin
          a=5; b=3;
          op=0; #10; if(y!==8) $display("❌ Add Failed"); else $display("✅ Add Passed");
          op=1; #10; if(y!==2) $display("❌ Sub Failed"); else $display("✅ Sub Passed");
          op=2; #10; if(y!==1) $display("❌ AND Failed"); else $display("✅ AND Passed");
          op=3; #10; if(y!==7) $display("❌ OR Failed"); else $display("✅ OR Passed");
          $finish;
        end
      endmodule
    `
  }
];
