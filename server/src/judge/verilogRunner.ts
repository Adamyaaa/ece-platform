import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// This function will:
// 1. Save user code to a file
// 2. Compile it using iverilog
// 3. Run it using vvp
// 4. Return the output
export const runVerilog = (userCode: string, testbenchCode: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../../temp');
    
    // Create a temp folder if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique file names so users don't overwrite each other
    const uniqueId = Date.now() + Math.random().toString(36).substring(7);
    const designFile = path.join(tempDir, `design_${uniqueId}.v`);
    const tbFile = path.join(tempDir, `tb_${uniqueId}.v`);
    const outputFile = path.join(tempDir, `out_${uniqueId}.vvp`);

    // 1. Write the files
    try {
      fs.writeFileSync(designFile, userCode);
      fs.writeFileSync(tbFile, testbenchCode);
    } catch (err) {
      return reject("Failed to write server files.");
    }

    // 2. Compile Command (iverilog)
    // -o = output file, then we list the source files
    const compileCmd = `iverilog -o "${outputFile}" "${designFile}" "${tbFile}"`;

    exec(compileCmd, (error, stdout, stderr) => {
      if (error) {
        // Cleanup and return compilation error
        cleanup([designFile, tbFile, outputFile]);
        return resolve(`❌ Compilation Failed:\n${stderr}`);
      }

      // 3. Execution Command (vvp)
      exec(`vvp "${outputFile}"`, (runErr, runOut, runStdErr) => {
        // Cleanup files
        cleanup([designFile, tbFile, outputFile]);

        if (runErr) {
          return resolve(`❌ Runtime Error:\n${runStdErr}`);
        }
        
        // Success! Return the simulation output
        resolve(runOut);
      });
    });
  });
};

// Helper to delete files after use
const cleanup = (files: string[]) => {
  files.forEach(file => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
};