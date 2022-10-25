import { createObjectCsvWriter } from 'csv-writer';
import csvToJson from 'csvtojson';
import path from 'path';

export const getJsonFromCSV = async (filePath: string) => {
  const json = await csvToJson({
    trim: true,
  }).fromFile(filePath);
  return json;
};

export const writeJsonToCsv = async (filePath: string, headers: any) => {
  const writer = await createObjectCsvWriter({
    path: path.resolve(filePath),
    header: headers,
  });
  return writer;
};
