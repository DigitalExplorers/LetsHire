import * as fs from 'fs';
import * as path from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import * as Handlebars from 'handlebars';

console.log('custom');
console.log(path.join(process.cwd(), 'templates'));

export class CustomHandlebarsAdapter extends HandlebarsAdapter {
  constructor() {
    super();
    this.registerPartials();
  }

  private registerPartials(): void {
    const partialsDir = path.join(process.cwd(), 'src', 'templates');
    const filenames = fs.readdirSync(partialsDir);

    filenames.forEach((filename: string) => {
      const matches = /^([^.]+).hbs$/.exec(filename);
      if (!matches) {
        return;
      }
      const name = matches[1];
      const template = fs.readFileSync(
        path.join(partialsDir, filename),
        'utf8',
      );
      Handlebars.registerPartial(name, template);
    });
  }
}
