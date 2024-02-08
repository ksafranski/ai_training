import ora from 'ora';

interface Logger {
  success: (...args: any[]) => void;
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  loading: (...args: any[]) => void;
  replaceCurrentText: (text: string) => void;
}

/**
 * A logger to make the output more readable, show loaders and handle errors
 */
export const logger = (): Logger => {
  let currentLog = {
    type: 'text',
    instance: null,
  };

  const indentJSON = (input: string | object | any[]): string => {
    return JSON.stringify(input, null, 2)
      .split('\n')
      .map((i: string) => `  ${i}`)
      .join('\n');
  };

  const completePrevious = (): void => {
    if (currentLog.instance && currentLog.type === 'loading') {
      currentLog.instance.succeed();
    }
  };

  const mapArgs = (args: any[]): string => {
    return args
      .map(i =>
        Array.isArray(i) || typeof i === 'object' ? `\n${indentJSON(i)}` : i
      )
      .join(' ');
  };

  return {
    success: (...args: any[]) => {
      completePrevious();
      currentLog = {
        type: 'success',
        instance: ora(mapArgs(args)).succeed(),
      };
    },
    info: (...args: any[]) => {
      completePrevious();
      currentLog = {
        type: 'info',
        instance: ora(mapArgs(args)).info(),
      };
    },
    error: (...args: any[]) => {
      completePrevious();
      currentLog = {
        type: 'error',
        instance: ora(mapArgs(args)).fail(),
      };
      process.exit(1);
    },
    warn: (...args: any[]) => {
      completePrevious();
      currentLog = {
        type: 'error',
        instance: ora(mapArgs(args)).warn(),
      };
    },
    loading: (...args: any[]) => {
      completePrevious();
      currentLog = {
        type: 'loading',
        instance: ora(args.join(' ')).start(),
      };
    },
    replaceCurrentText: (text: string) => {
      if (currentLog.instance) {
        currentLog.instance.text = text;
      }
    },
  };
};

export default logger();
