interface ProgramOptions {
    isComponent: boolean
    isModule: boolean
    includeImport: boolean
    includeContext: boolean
  };

const context = {
    options: {
        isComponent: false,
        isModule: false,
        includeImport: false,
        includeContext: false
    }
};

export const setProgramOptions = (options: ProgramOptions) => {
    context.options = options;
}

export const getProgramOptions = () => context.options;
