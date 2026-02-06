import { config, library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import {
  faPaperPlane,
  faMusic,
  faCheck,
  faCircleNotch,
  faChevronDown,
  faChevronUp,
  faXmark,
  faSliders,
  faFileArrowDown,
  faCircleExclamation,
  faArrowRotateRight,
  faMagnifyingGlass,
  faPaste,
  faImage,
  faSun,
  faMoon,
  faCircleQuestion,
  faGear,
  faBars,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

// Prevent Font Awesome from adding its CSS automatically (we import it above)
config.autoAddCss = false;

library.add(
  faPaperPlane,
  faMusic,
  faCheck,
  faCircleNotch,
  faChevronDown,
  faChevronUp,
  faXmark,
  faSliders,
  faFileArrowDown,
  faCircleExclamation,
  faArrowRotateRight,
  faMagnifyingGlass,
  faPaste,
  faImage,
  faSun,
  faMoon,
  faCircleQuestion,
  faGear,
  faBars,
  faPlus,
);
