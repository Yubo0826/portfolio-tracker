import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura';

export default definePreset(Aura, {
  semantic: {
    /*
        定義明暗模式用的顏色，顏色值可以參考這裡：
        https://primevue.org/theming/styled/#colors
    */
    colorScheme: {
      light: {
        primary: {
          color: '{indigo.500}',
          contrastColor: '#ffffff',
          hoverColor: '{indigo.600}',
          activeColor: '{indigo.700}'
        },
        surface: {
          background: '{zinc.50}',
          textColor: '{zinc.800}'
        }
      },
      dark: {
        primary: {
          color: '{indigo.400}',
          contrastColor: '#ffffff',
          hoverColor: '{indigo.300}',
          activeColor: '{indigo.200}'
        },
        surface: {
          background: '#282832',
          textColor: '{zinc.100}'
        }
      }
    }
  },

  // 可以進一步針對特定元件覆寫樣式
  components: {
    button: {
      colorScheme: {
        light: {
          background: '{primary.color}',
          color: '{primary.contrastColor}'
        },
        dark: {
          background: '{primary.color}',
          color: '{primary.contrastColor}'
        }
      }
    },
    card: {
      colorScheme: {
        light: {
          background: '{surface.background}',
          color: '{surface.textColor}'
        },
        dark: {
          background: '{surface.background}',
          color: '{surface.textColor}'
        }
      }
    },
    datatable: {
      colorScheme: {
        light: {
          background: '{surface.background}',
          headerBackground: '{indigo.100}',
          headerColor: '{zinc.800}',
          rowHoverBackground: '{indigo.50}'
        },
        dark: {
          background: '{surface.background}',
          headerBackground: '{indigo.900}',
          headerColor: '{zinc.100}',
          rowHoverBackground: '{indigo.800}'
        }
      }
    }
  }
})
